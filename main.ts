// Run:
// deno task start
//
// deno task ngrok
//

import { discord } from "./deps.ts";
import { DiscordAPIClient, verify } from "./discord/mod.ts";
import { APP_SHORTER, SHORTER_ALIAS } from "./app/mod.ts";
import type { ShorterOptions } from "./shorter.ts";
import { shorter } from "./shorter.ts";
import * as env from "./env.ts";

const api = new DiscordAPIClient();

if (import.meta.main) {
  await main();
}

/**
 * main is the entrypoint for the Shorter application command.
 */
export function main() {
  // Start the server.
  Deno.serve({ port: env.PORT, onListen }, handle);
}

async function onListen() {
  // Overwrite the Discord Application Command.
  await api.registerCommand({
    app: APP_SHORTER,
    botID: env.DISCORD_CLIENT_ID,
    botToken: env.DISCORD_TOKEN,
  });

  // Log the invite URL.
  console.log(
    "Invite Shorter to a server:",
    `https://discord.com/api/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&scope=applications.commands`,
  );

  // Log the application information.
  console.log(
    "Discord application information:",
    `https://discord.com/developers/applications/${env.DISCORD_CLIENT_ID}/bot`,
  );
}

/**
 * handle is the HTTP handler for the Shorter application command.
 */
export async function handle(request: Request): Promise<Response> {
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
        .then((result) =>
          api.editOriginalInteractionResponse({
            botID: env.DISCORD_CLIENT_ID,
            botToken: env.DISCORD_TOKEN,
            interactionToken: interaction.token,
            content:
              `Created commit [${result.message}](https://acmcsuf.com/code/commit/${result.sha})!`,
          })
        )
        .catch((error) => {
          if (error instanceof Error) {
            api.editOriginalInteractionResponse({
              botID: env.DISCORD_CLIENT_ID,
              botToken: env.DISCORD_TOKEN,
              interactionToken: interaction.token,
              content: error.message,
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
    ?.find((option) => option.name === SHORTER_ALIAS);
  if (destinationOption?.type !== discord.ApplicationCommandOptionType.String) {
    throw new Error("Invalid destination");
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
    },
  };
}
