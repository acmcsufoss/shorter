# shorter

🔗 Discord slash command URL shortener.

## Development

### Run the server

> **NOTE**
>
> Be sure to set the environment variables before running the server.
>
> Be sure to [install Deno](https://deno.land/install) before running the
> server.

You will need to use two terminal windows; one for the HTTP server and one for
Ngrok.

#### Terminal 1

To run the server, run the following command:

```bash
deno task start
```

#### Terminal 2

> **NOTE** You will need to have
> [Ngrok](https://dashboard.ngrok.com/get-started/setup) installed and in your
> path.

```bash
deno task ngrok
```

In **Terminal 2**, copy the URL that is generated under **Forwarding**.

- The URL should look similar to this:
  `https://ab01-23-456-78-910.ngrok-free.app`

Set this new URL as the **Interactions Endpoint URL** in the **General** tab of
your Discord application. Find your application
[here](https://discord.com/developers/applications).

### Deploy

This server is deployed on [Deno Deploy](https://deno.com/deploy). To deploy,
set the entrypoint file to `main.ts` and set the environment variables in the
Deno Deploy dashboard.

### Slash command usage

To understand the usage of the slash command, refer to the source code in
[`bot/app/app.ts`](bot/app/app.ts).

### Discord Application Command setup

1. [Create a Discord application](https://discord.com/developers/applications).
1. Create a bot for the application.
1. Copy the bot token and set it as the `DISCORD_TOKEN` environment variable.
1. Copy the public key and set it as the `DISCORD_PUBLIC_KEY` environment
   variable.
1. Copy the client ID and set it as the `DISCORD_CLIENT_ID` environment
   variable.
1. Spin up the server. Set the Discord interactions endpoint URL to the URL of
   the server (Ngrok or Deno Deploy).

### Environment variables

Refer to `.env.example` for a list of environment variables that need to be set.

#### `DISCORD_PUBLIC_KEY`

The public key of the Discord application. This is used to verify that the
request is coming from Discord.

#### `DISCORD_CLIENT_ID`

The client ID of the Discord application. This is used to generate the OAuth2
URL.

#### `DISCORD_TOKEN`

The bot token of the Discord application.

#### `DISCORD_ROLE_ID`

The ID of the role that is allowed to use the slash command. Board members are
intended to use this command.

#### `GITHUB_TOKEN`

The GitHub personal access token. This is used to access the GitHub API via
[Codemod](https://deno.land/x/codemod).

#### `PORT`

**Not required**. The port that the server will listen on.

#### `DEV`

**Not required**. If set to `true`, the server will spin up an Ngrok tunnel and
print the URL to the console. This is intended for development. Paste this URL
into the Discord application's Discord interactions endpoint URL.

---

Programmed with ❤️ by [**@acmcsufoss**](https://oss.acmcsuf.com/).
