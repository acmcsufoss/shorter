import { discord } from "../deps.ts";

export const SHORTER = "shorter";
export const SHORTER_DESCRIPTION = "Manage acmcsuf.com shortlinks.";

export const SHORTER_ALIAS = "alias";
export const SHORTER_ALIAS_DESCRIPTION =
  "The alias of the shortlink (e.g. `discord`, `example/a/b/c`, etc.).";

export const SHORTER_DESTINATION = "destination";
export const SHORTER_DESTINATION_DESCRIPTION =
  "The destination of the shortlink.";

/**
 * APP_SHORTER is the top-level command for the Shorter Application Command.
 */
export const APP_SHORTER: discord.RESTPostAPIApplicationCommandsJSONBody = {
  type: discord.ApplicationCommandType.ChatInput,
  name: SHORTER,
  description: SHORTER_DESCRIPTION,
  options: [
    {
      type: discord.ApplicationCommandOptionType.String,
      name: SHORTER_ALIAS,
      description: SHORTER_ALIAS_DESCRIPTION,
      required: true,
    },
    {
      type: discord.ApplicationCommandOptionType.String,
      name: SHORTER_DESTINATION,
      description: SHORTER_DESTINATION_DESCRIPTION,
      required: true,
    },
  ],
};
