import { discord } from "shorter/deps.ts";
import type { AppSchema } from "shorter/deps.ts";

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
    },
    // TODO: Create the "remove" subcommand.
  },
} as const satisfies AppSchema;
