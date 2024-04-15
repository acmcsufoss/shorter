import { Duration } from "durationjs";
// TODO: Export all APIInteractionResponse types from api types.
import type { APIInteractionResponseDeferredChannelMessageWithSource } from "@discord-applications/app";
import {
  createApp,
  InteractionResponseType,
  // TODO: Export all MessageFlags from api types.
  MessageFlags,
} from "@discord-applications/app";
import type { ShorterOptions } from "shorter/lib/shorter/mod.ts";
import { shorter } from "shorter/lib/shorter/mod.ts";
import { DiscordAPIClient } from "shorter/lib/discord/mod.ts";
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
import { appSchema } from "./app_schema.ts";

const INVITE_URL =
  `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&scope=applications.commands`;
const APPLICATION_URL =
  `https://discord.com/developers/applications/${DISCORD_CLIENT_ID}/bot`;

// TODO: Implement editOriginalInteractionResponse in DiscordAPIClient.
const discordAPI = new DiscordAPIClient();

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
  const handleInteraction = await createApp(
    {
      applicationID: DISCORD_CLIENT_ID,
      publicKey: DISCORD_PUBLIC_KEY,
      register: { token: DISCORD_TOKEN },
      schema: appSchema,
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
              botID: DISCORD_CLIENT_ID,
              botToken: DISCORD_TOKEN,
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
                botID: DISCORD_CLIENT_ID,
                botToken: DISCORD_TOKEN,
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
            type: discord.InteractionResponseType.ChannelMessageWithSource,
            data: {
              flags: discord.MessageFlags.Ephemeral,
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
              botID: DISCORD_CLIENT_ID,
              botToken: DISCORD_TOKEN,
              interactionToken: interaction.token,
              content:
                `Removed \`${interaction.data.parsedOptions.alias}\` in commit [${result.message}](https://acmcsuf.com/code/commit/${result.sha}).`,
            });
          })
          .catch((error) => {
            if (error instanceof Error) {
              discordAPI.editOriginalInteractionResponse({
                botID: DISCORD_CLIENT_ID,
                botToken: DISCORD_TOKEN,
                interactionToken: interaction.token,
                content: `Error: ${error.message}`,
              });
            }

            console.error(error);
          });

        // Acknowledge the interaction.
        return {
          type:
            discord.InteractionResponseType.DeferredChannelMessageWithSource,
        } satisfies discord.APIInteractionResponseDeferredChannelMessageWithSource;
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
    handleInteraction,
  );
}

function toDiscordTimestamp(timestamp: number) {
  return `<t:${~~timestamp}:R>`;
}
