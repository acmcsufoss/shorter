import * as discord from "discord-api-types";
import type { AppSchema } from "discord-app";

export const appSchema = {
  chatInput: {
    name: "shorter",
    description: "Manage shortlinks.",
    subcommands: {
      add: {
        description: "Add a shortlink.",
        options: {
          alias: {
            type: discord.ApplicationCommandOptionType.String,
            description: "The alias of the shortlink",
            required: true,
          },
          destination: {
            type: discord.ApplicationCommandOptionType.String,
            description: "The destination of the shortlink",
            required: true,
          },
          force: {
            type: discord.ApplicationCommandOptionType.Boolean,
            description: "Whether to overwrite an existing shortlink",
          },
          ttl: {
            type: discord.ApplicationCommandOptionType.String,
            description: "The time-to-live of the shortlink",
          },
        },
      },
      remove: {
        description: "Remove a shortlink.",
        options: {
          alias: {
            type: discord.ApplicationCommandOptionType.String,
            description: "The alias of the shortlink",
            required: true,
          },
        },
      },
    },
  },
} as const satisfies AppSchema;
