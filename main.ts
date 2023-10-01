// Run:
// deno task start
//
// deno task ngrok
//

import { discord, Duration } from "./deps.ts";
import { DiscordAPIClient, verify } from "./discord/mod.ts";
import {
  APP_SHORTER,
  SHORTER_ALIAS,
  SHORTER_DESTINATION,
  SHORTER_TTL,
  SHORTER_FORCE,
} from "./app/mod.ts";
import type { ShorterOptions } from "./shorter.ts";
import { shorter } from "./shorter.ts";
import { addTTLMessage, listenToTTLChannel } from "./queue.ts";
import * as env from "./env.ts";

const api = new DiscordAPIClient();

if (import.meta.main) {
  await main();
}

/**
 * main is the entrypoint for the Shorter application command.
 */
export async function main() {
  // Set up queue listener.
  const kv = await Deno.openKv();
  kv.listenQueue(listenToTTLChannel);

  // Start the server.
  Deno.serve(
    { port: env.PORT, onListen },
    makeHandler(kv),
  );
}

async function onListen() {
  // Overwrite the Discord Application Command.
  await api.registerCommand({
    app: APP_SHORTER,
    botID: env.DISCORD_CLIENT_ID,
    botToken: env.DISCORD_TOKEN,
  });

  // Log the invite URL.
  console.log("Invite Shorter to a server:", INVITE_URL);

  // Log the application information.
  console.log("Discord application information:", APPLICATION_URL);
}

/**
 * makeHandler makes the HTTP handler for the Shorter application command.
 */
export function makeHandler(kv: Deno.Kv) {
  /**
   * handle is the HTTP handler for the Shorter application command.
   */
  return async function handle(request: Request): Promise<Response> {
    // Redirect to the invite URL on GET /invite.
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/invite") {
      return Response.redirect(INVITE_URL);
    }

    // Verify the request.
    const { error, body } = await verify(request, env.DISCORD_PUBLIC_KEY);
    if (error !== null) {
      return error;
    }

    // Parse the incoming request as JSON.
    const interaction = await JSON.parse(body) as discord.APIInteraction;
    switch (interaction.type) {
      case discord.InteractionType.Ping: {
        return Response.json({ type: discord.InteractionResponseType.Pong });
      }

      case discord.InteractionType.ApplicationCommand: {
        if (
          !discord.Utils.isChatInputApplicationCommandInteraction(interaction)
        ) {
          return new Response("Invalid request", { status: 400 });
        }

        if (!interaction.member?.user) {
          return new Response("Invalid request", { status: 400 });
        }

        if (
          !interaction.member.roles.some((role) => env.DISCORD_ROLE_ID === role)
        ) {
          return new Response("Invalid request", { status: 400 });
        }

        // Make the Shorter options.
        const options = makeShorterOptions(
          interaction.member,
          interaction.data,
        );

        // Invoke the Shorter operation.
        shorter(options)
          .then(async (result) => {
            // Send the success message.
            await api.editOriginalInteractionResponse({
              botID: env.DISCORD_CLIENT_ID,
              botToken: env.DISCORD_TOKEN,
              interactionToken: interaction.token,
              content:
                `Created commit [${result.message}](https://acmcsuf.com/code/commit/${result.sha})!`,
            });

            // Get the TTL option.
            const ttlOption = interaction.data.options
              ?.find((option) => option.name === SHORTER_TTL);
            if (ttlOption) {
              if (
                ttlOption.type !== discord.ApplicationCommandOptionType.String
              ) {
                throw new Error("Invalid TTL");
              }

              // Parse the TTL in milliseconds.
              const ttlDuration = Duration.fromString(ttlOption.value).raw;

              // Enqueue the delete operation.
              await addTTLMessage(kv, {
                alias: options.data.alias,
                actor: options.actor,
              }, ttlDuration);
            }
          })
          .catch((error) => {
            if (error instanceof Error) {
              api.editOriginalInteractionResponse({
                botID: env.DISCORD_CLIENT_ID,
                botToken: env.DISCORD_TOKEN,
                interactionToken: interaction.token,
                content: `Error: ${error.message}`,
              });
            }

            console.error(error);
          });

        // Acknowledge the interaction.
        return Response.json(
          {
            type:
              discord.InteractionResponseType.DeferredChannelMessageWithSource,
          } satisfies discord.APIInteractionResponseDeferredChannelMessageWithSource,
        );
      }

      default: {
        return new Response("Invalid request", { status: 400 });
      }
    }
  };
}

/**
 * makeShorterOptions makes the Shorter options from the Discord interaction.
 */
export function makeShorterOptions(
  member: discord.APIInteractionGuildMember,
  data: discord.APIChatInputApplicationCommandInteractionData,
): ShorterOptions {
  const aliasOption = data.options
    ?.find((option) => option.name === SHORTER_ALIAS);
  if (aliasOption?.type !== discord.ApplicationCommandOptionType.String) {
    throw new Error("Invalid alias");
  }

  const destinationOption = data.options
    ?.find((option) => option.name === SHORTER_DESTINATION);
  if (destinationOption?.type !== discord.ApplicationCommandOptionType.String) {
    throw new Error("Invalid destination");
  }

  const forceOption = data.options
    ?.find((option) => option.name === SHORTER_FORCE);
  if (forceOption?.type !== discord.ApplicationCommandOptionType.Boolean) {
    throw new Error("Invalid force");
  }

  return {
    githubPAT: env.GITHUB_TOKEN,
    actor: {
      tag: member.user.username,
      nick: member.nick || undefined,
    },
    data: {
      alias: aliasOption.value,
      destination: destinationOption.value,
      force: forceOption.value,
    },
  };
}

const INVITE_URL =
  `https://discord.com/api/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&scope=applications.commands`;
const APPLICATION_URL =
  `https://discord.com/developers/applications/${env.DISCORD_CLIENT_ID}/bot`;
