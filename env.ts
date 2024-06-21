/**
 * PORT is the port to listen on.
 */
export const PORT = parseInt(Deno.env.get("PORT") || "8080");

const RAW_DISCORD_PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY");
if (!RAW_DISCORD_PUBLIC_KEY) {
  throw new Error("DISCORD_PUBLIC_KEY environment variable is required");
}

/**
 * DISCORD_PUBLIC_KEY is the Discord bot public key.
 */
export const DISCORD_PUBLIC_KEY = RAW_DISCORD_PUBLIC_KEY;

const RAW_DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID");
if (!RAW_DISCORD_CLIENT_ID) {
  throw new Error("DISCORD_CLIENT_ID environment variable is required");
}

/**
 * DISCORD_CLIENT_ID is the Discord bot client ID.
 */
export const DISCORD_CLIENT_ID = RAW_DISCORD_CLIENT_ID;

const RAW_DISCORD_TOKEN = Deno.env.get("DISCORD_TOKEN");
if (!RAW_DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN environment variable is required");
}

/**
 * DISCORD_TOKEN is the Discord bot token.
 */
export const DISCORD_TOKEN = RAW_DISCORD_TOKEN;

const RAW_DISCORD_ROLE_ID = Deno.env.get("DISCORD_ROLE_ID");
if (!RAW_DISCORD_ROLE_ID) {
  throw new Error("DISCORD_ROLE_ID environment variable is required");
}

/**
 * DISCORD_ROLE_ID is the Discord board role ID.
 */
export const DISCORD_ROLE_ID = RAW_DISCORD_ROLE_ID.split(",");

const RAW_GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
if (!RAW_GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN environment variable is required");
}

/**
 * GITHUB_TOKEN is the GitHub personal access token.
 */
export const GITHUB_TOKEN = RAW_GITHUB_TOKEN;
