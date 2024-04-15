import type { AppSchema } from "@discord-applications/app";
import { ApplicationCommandOptionType } from "@discord-applications/app";

export const appSchema = {
  chatInput: {
    name: "shorter",
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
