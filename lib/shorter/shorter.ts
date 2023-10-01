import { createCodemod } from "shorter/deps.ts";

/**
 * shorter executes the code modification to shorten a URL.
 */
export async function shorter(options: ShorterOptions): Promise<ShorterResult> {
  const message = formatCommitMessage(options);
  const codemodResult = await createCodemod((codemod) =>
    codemod
      .createTree((tree) =>
        tree
          .baseRef(ACMCSUF_MAIN_BRANCH)
          .text(ACMCSUF_LINKS_PATH, (text) => {
            const data = JSON.parse(text);
            const isAliasTaken = data[options.data.alias] !== undefined;
            if (!options.data.force && isAliasTaken) {
              throw new Error(
                `the alias \`${options.data.alias}\` already exists`,
              );
            }

            if (options.data.destination === undefined) {
              delete data[options.data.alias];
            } else {
              data[options.data.alias] = options.data.destination;
            }

            return JSON.stringify(data, null, 2) + "\n";
          })
      )
      .createCommit(({ 0: tree }) => ({
        message,
        tree: tree.sha,
      }), (commit) => commit.parentRef(ACMCSUF_MAIN_BRANCH))
      .updateBranch(({ 1: commit }) => ({
        ref: ACMCSUF_MAIN_BRANCH,
        sha: commit.sha,
      })), {
    owner: ACMCSUF_OWNER,
    repo: ACMCSUF_REPO,
    token: options.githubPAT,
  });

  return {
    sha: codemodResult[1].sha,
    message,
  };
}

/**
 * ShorterOptions are the options for the shorter API.
 */
export interface ShorterOptions {
  /**
   * githubPAT is the GitHub personal access token to use to authenticate with
   * the GitHub API.
   */
  githubPAT: string;

  /**
   * actor is the user who invoked the slash command.
   */
  actor: {
    /**
     * tag is the Discord tag of the actor.
     */
    tag: string;

    /**
     * nick is the nickname of the actor.
     */
    nick?: string;
  };

  /**
   * data is the data to shorten a URL.
   */
  data: {
    /**
     * alias is the alias of the destination URL.
     */
    alias: string;

    /**
     * destination is the destination location.
     *
     * If destination is not provided, the alias will be removed.
     */
    destination?: string;

    /**
     * force is whether to overwrite an existing shortlink.
     */
    force?: boolean;
  };
}

/**
 * ShorterResult is the result of the shorter function.
 */
export interface ShorterResult {
  /**
   * sha is the SHA of the commit that was created on the main branch.
   */
  sha: string;

  /**
   * message is the commit message.
   */
  message: string;
}

function formatCommitMessage(options: ShorterOptions): string {
  return `update \`/${options.data.alias}\` shortlink`;
}

/**
 * ACMCSUF_OWNER is the owner of the acmcsuf.com GitHub repository.
 */
export const ACMCSUF_OWNER = "EthanThatOneKid";

/**
 * ACMCSUF_REPO is the name of the acmcsuf.com GitHub repository.
 */
export const ACMCSUF_REPO = "acmcsuf.com";

/**
 * ACMCSUF_MAIN_BRANCH is the name of the main branch of the acmcsuf.com GitHub
 */
export const ACMCSUF_MAIN_BRANCH = "main";

/**
 * ACMCSUF_LINKS_PATH is the path to the board data file.
 */
export const ACMCSUF_LINKS_PATH = "src/lib/public/links/links.json";
