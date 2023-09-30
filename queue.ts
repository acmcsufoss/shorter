import type { ShorterOptions } from "./shorter.ts";
import { shorter } from "./shorter.ts";
import * as env from "./env.ts";

/**
 * TTLMessage is a message received from the TTL channel.
 */
export interface TTLMessage {
  channel: "ttl";
  data: {
    alias: string;
    actor: ShorterOptions["actor"];
  };
}

/**
 * listenToTTLChannel listens to the TTL channel.
 */
export function listenToTTLChannel(m: unknown) {
  if ((m as TTLMessage).channel === "ttl") {
    const data = (m as TTLMessage).data;

    // Remove the shortlink from persisted storage.
    shorter({
      githubPAT: env.GITHUB_TOKEN,
      actor: data.actor,
      // Omitting the destination will remove the alias.
      data: { alias: data.alias },
    })
      .catch((error) => {
        if (error instanceof Error) {
          console.error(error);
        }
      });
  }
}

/**
 * addTTLMessage adds a TTL message to the TTL channel.
 */
export async function addTTLMessage(
  kv: Deno.Kv,
  data: TTLMessage["data"],
  delay: number,
) {
  return await kv.enqueue(
    { channel: "ttl", data },
    { delay },
  );
}
