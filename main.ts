import { Duration } from "durationjs";
import type {
  APIInteractionResponseDeferredChannelMessageWithSource,
  AppSchema,
} from "@discord-applications/app";
import {
  ApplicationCommandOptionType,
  createApp,
  DiscordAPI,
  InteractionResponseType,
  MessageFlags,
} from "@discord-applications/app";
import type { ShorterOptions } from "shorter/lib/shorter/mod.ts";
import { shorter } from "shorter/lib/shorter/mod.ts";
import {
  addTTLMessage,
  makeTTLMessageListener,
} from "shorter/lib/queues/mod.ts";
import {
  DISCORD_CLIENT_ID,
  DISCORD_PUBLIC_KEY,
  DISCORD_ROLE_ID,
  DISCORD_TOKEN,
  GITHUB_TOKEN,
  PORT,
} from "shorter/env.ts";

const INVITE_URL =
  `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&scope=applications.commands`;
const APPLICATION_URL =
  `https://discord.com/developers/applications/${DISCORD_CLIENT_ID}/bot`;

const discordAPI = new DiscordAPI({
  applicationID: DISCORD_CLIENT_ID,
  token: DISCORD_TOKEN,
  publicKey: DISCORD_PUBLIC_KEY,
});

export const shorterSchema = {
  chatInput: {
    name: "Shorter",
    description: "Manage shortlinks.",
    subcommands: {
      add: {
        description: "Add a shortlink.",
        options: {
          alias: {
            type: ApplicationCommandOptionType.String,
            description: "The alias of the shortlink",
            required: true,
          },
          destination: {
            type: ApplicationCommandOptionType.String,
            description: "The destination of the shortlink",
            required: true,
          },
          force: {
            type: ApplicationCommandOptionType.Boolean,
            description: "Whether to overwrite an existing shortlink",
          },
          ttl: {
            type: ApplicationCommandOptionType.String,
            description: "The time-to-live of the shortlink",
          },
        },
      },
      remove: {
        description: "Remove a shortlink.",
        options: {
          alias: {
            type: ApplicationCommandOptionType.String,
            description: "The alias of the shortlink",
            required: true,
          },
        },
      },
    },
  },
} as const satisfies AppSchema;

if (import.meta.main) {
  await main();
}

/**
 * main is the entrypoint for the Shorter application command.
 */
export async function main() {
  // Set up queue listener.
  const kv = await Deno.openKv();
  const ttlMessageListener = makeTTLMessageListener(GITHUB_TOKEN);
  kv.listenQueue(async (message) => {
    await ttlMessageListener(message);
  });

  // Create the Discord application.
  const shorterApp = await createApp(
    {
      schema: shorterSchema,
      applicationID: DISCORD_CLIENT_ID,
      publicKey: DISCORD_PUBLIC_KEY,
      token: DISCORD_TOKEN,
      register: true,
    },
    {
      add(interaction) {
        if (!interaction.member?.user) {
          throw new Error("Invalid request");
        }

        if (
          !interaction.member.roles.some((role) => DISCORD_ROLE_ID === role)
        ) {
          return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              flags: MessageFlags.Ephemeral,
              content: "You do not have permission to use this command.",
            },
          };
        }

        // Make shorter options.
        const shorterOptions: ShorterOptions = {
          githubPAT: GITHUB_TOKEN,
          actor: {
            tag: interaction.member.user.username,
            nick: interaction.member.nick || undefined,
          },
          data: {
            alias: interaction.data.parsedOptions.alias,
            destination: interaction.data.parsedOptions.destination,
            force: interaction.data.parsedOptions.force,
          },
        };

        // Invoke the Shorter operation.
        shorter(shorterOptions)
          .then(async (result) => {
            // Parse the TTL duration.
            const ttlDuration = interaction.data.parsedOptions.ttl &&
              Duration.fromString(interaction.data.parsedOptions.ttl);

            // Compose the commit message.
            let content =
              `Created commit [${result.message}](https://acmcsuf.com/code/commit/${result.sha})!`;
            if (ttlDuration) {
              // Render to Discord timestamp format.
              // https://gist.github.com/LeviSnoot/d9147767abeef2f770e9ddcd91eb85aa
              const discordTimestamp = toDiscordTimestamp(
                (Date.now() + ttlDuration.raw) * 0.001,
              );
              content += `\n\nThis shortlink will expire ${discordTimestamp}.`;
            }

            // Send the success message.
            await discordAPI.editOriginalInteractionResponse({
              interactionToken: interaction.token,
              content,
            });

            // Enqueue the delete operation if TTL is set.
            if (!ttlDuration) {
              return;
            }

            await addTTLMessage(
              kv,
              {
                alias: shorterOptions.data.alias,
                actor: shorterOptions.actor,
              },
              ttlDuration.raw,
            );
          })
          .catch((error) => {
            if (error instanceof Error) {
              discordAPI.editOriginalInteractionResponse({
                interactionToken: interaction.token,
                content: `Error: ${error.message}`,
              });
            }

            console.error(error);
          });

        // Acknowledge the interaction.
        return {
          type: InteractionResponseType.DeferredChannelMessageWithSource,
        } satisfies APIInteractionResponseDeferredChannelMessageWithSource;
      },
      remove(interaction) {
        if (!interaction.member?.user) {
          throw new Error("Invalid request");
        }

        if (
          !interaction.member.roles.some((role) => DISCORD_ROLE_ID === role)
        ) {
          return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              flags: MessageFlags.Ephemeral,
              content: "You do not have permission to use this command.",
            },
          };
        }

        // Make shorter options.
        const shorterOptions: ShorterOptions = {
          githubPAT: GITHUB_TOKEN,
          actor: {
            tag: interaction.member.user.username,
            nick: interaction.member.nick || undefined,
          },
          data: { alias: interaction.data.parsedOptions.alias },
        };

        // Invoke the Shorter operation.
        shorter(shorterOptions)
          .then(async (result) => {
            // Send the success message.
            await discordAPI.editOriginalInteractionResponse({
              interactionToken: interaction.token,
              content:
                `Removed \`${interaction.data.parsedOptions.alias}\` in commit [${result.message}](https://acmcsuf.com/code/commit/${result.sha}).`,
            });
          })
          .catch((error) => {
            if (error instanceof Error) {
              discordAPI.editOriginalInteractionResponse({
                interactionToken: interaction.token,
                content: `Error: ${error.message}`,
              });
            }

            console.error(error);
          });

        // Acknowledge the interaction.
        return {
          type: InteractionResponseType.DeferredChannelMessageWithSource,
        } satisfies APIInteractionResponseDeferredChannelMessageWithSource;
      },
    },
  );

  // Start the server.
  Deno.serve(
    {
      port: PORT,
      onListen() {
        // Log the invite URL.
        console.log("Invite Shorter to a server:", INVITE_URL);

        // Log the application information.
        console.log("Discord application information:", APPLICATION_URL);
      },
    },
    shorterApp,
  );
}

function toDiscordTimestamp(timestamp: number) {
  return `<t:${~~timestamp}:R>`;
}
