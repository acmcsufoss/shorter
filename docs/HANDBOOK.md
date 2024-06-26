# Handbook

This brief handbook contains comprehensive knowledge needed to update shortlinks
on `acmcsuf.com` with confidence.

## Table of contents

- [Understanding shortlink storage](#understanding-shortlink-storage)
- [The internal tool](#the-internal-tool)

## Understanding shortlink storage

The `acmcsuf.com/*` shortlinks are stored in a static JSON file
[`src/lib/public/links/links.json`](https://acmcsuf.com/code/blob/main/src/lib/public/links/links.json)
(preview all shortlinks on <https://acmcsuf.com/shorter>) tracked in the
[`acmcsuf.com`](https://acmcsuf.com/code) repository on GitHub.

### Format

> **NOTE**
>
> The format of the JSON file is not required to be known to update shortlinks
> on `acmcsuf.com`. This section is for those who are curious.

The [`acmcsuf.com`](https://acmcsuf.com/code) repository uses a formatter tool
named Prettier to format the JSON file. The formatter is configured in a file
located in the root of the repository,
[`.prettierrc`](https://acmcsuf.com/code/blob/main/.prettierrc). A GitHub
workflow checks if the JSON file is formatted correctly on every push to the
`acmcsuf.com` repository's main branch.

The `links.json` file is…

- [Standard JSON](https://datatracker.ietf.org/doc/html/rfc8259)
- Indentations are 2 spaces (not tabs)
- Keys and values are wrapped in double quotes (`"`)
- The final property will not have a trailing comma
- The file ends with a newline character

### Example

The destination string of a shortlink may be a
[fully qualified URL](https://datatracker.ietf.org/doc/html/rfc3986).

```json
{
  "github": "https://github.com/acmcsufoss",
  "instagram": "https://instagram.com/acmcsuf",
  "linkedin": "https://linkedin.com/company/acm-at-csuf"
}
```

| Visit                           | Alias       | Destination                                |
| ------------------------------- | ----------- | ------------------------------------------ |
| <https://acmcsuf.com/github>    | `github`    | <https://github.com/acmcsufoss>            |
| <https://acmcsuf.com/instagram> | `instagram` | <https://instagram.com/acmcsuf>            |
| <https://acmcsuf.com/linkedin>  | `linkedin`  | <https://linkedin.com/company/acm-at-csuf> |

Alternatively, the destination string may be a relative path of an existing
shortlink alias, including URL hash or query parameters.

```json
{
  "shorter-readme": "github/shorter#readme",
  "shorter-closed-prs": "github/shorter/pulls?q=is%3Apr+is%3Aclosed"
}
```

| Visit                                    | Alias                | Destination                                                          | Explanation                                                               |
| ---------------------------------------- | -------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| <https://acmcsuf.com/shorter-readme>     | `shorter-readme`     | <https://github.com/acmcsufoss/shorter#readme>                       | `https://github.com/acmcsufoss` + `/shorter#readme`                       |
| <https://acmcsuf.com/shorter-closed-prs> | `shorter-closed-prs` | <https://github.com/acmcsuf.com/shorter/pulls?q=is%3Apr+is%3Aclosed> | `https://github.com/acmcsuf.com` + `/shorter/pulls?q=is%3Apr+is%3Aclosed` |

Additionally, the alias string may be nested to create a hierarchy of
shortlinks.

```json
{
  "vc/ai": "https://discord.com/channels/710225099923521558/1016446711880745032",
  "vc/algo": "https://discord.com/channels/710225099923521558/935637646762450966",
  "vc/design": "https://discord.com/channels/710225099923521558/935637681373839401",
  "vc/dev": "https://discord.com/channels/710225099923521558/935637701594611742",
  "vc/gamedev": "https://discord.com/channels/710225099923521558/1121137782987952280"
}
```

| Visit                            | Alias        | Destination                                                           |
| -------------------------------- | ------------ | --------------------------------------------------------------------- |
| <https://acmcsuf.com/vc/ai>      | `vc/ai`      | <https://discord.com/channels/710225099923521558/1016446711880745032> |
| <https://acmcsuf.com/vc/algo>    | `vc/algo`    | <https://discord.com/channels/710225099923521558/935637646762450966>  |
| <https://acmcsuf.com/vc/design>  | `vc/design`  | <https://discord.com/channels/710225099923521558/935637681373839401>  |
| <https://acmcsuf.com/vc/dev>     | `vc/dev`     | <https://discord.com/channels/710225099923521558/935637701594611742>  |
| <https://acmcsuf.com/vc/gamedev> | `vc/gamedev` | <https://discord.com/channels/710225099923521558/1121137782987952280> |

## The internal tool

The internal tool is a Discord slash command named _Shorter_ that allows board
members to update `acmcsuf.com` shortlinks with ease.

> **NOTE**
>
> _Shorter_'s source code is located at <https://oss.acmcsuf.com/shorter>!

### Security

This tool leverages Discord's permissions system to elevate the security of the
`acmcsuf.com` repository, allowing only board members to update shortlinks.

### Operate with confidence

The software is a simple
[Discord slash command](https://discord.com/developers/docs/interactions/application-commands).
All that is required to use the tool is a Discord account with the `Board` role
on the [ACM CSUF Discord server](https://acmcsuf.com/discord).

- This slash command is only available to members with the `Board` role.
- This slash command is available in all text channels of the
  [ACM CSUF Discord server](https://acmcsuf.com/discord).
- Type `/shorter add` in any text channel to add a new shortlink.
- Populate both required fields `alias` and `destination` with your desired
  alias string and destination string, respectively.
- Press <kbd>Enter</kbd> to submit the update.
- Wait for the response from the slash command to confirm the update. This may
  take around 3 seconds.
- Wait for redeployment to complete. This may take up to 60 seconds.

---

Developed with 💖 by [**@acmcsufoss**](https://oss.acmcsuf.com/)
