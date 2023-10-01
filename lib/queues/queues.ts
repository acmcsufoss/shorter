import type { ShorterOptions } from "shorter/lib/shorter/mod.ts";
import { shorter } from "shorter/lib/shorter/mod.ts";

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
 * isTTLMessage checks if the message is a TTL message.
 */
export function isTTLMessage(m: unknown): m is TTLMessage {
  return (m as TTLMessage).channel === "ttl";
}

/**
 * makeTTLMessageListener makes a TTL message listener.
 */
export function makeTTLMessageListener(
  githubPAT: string,
) {
  /**
   * listenToTTLChannel listens to the TTL channel.
   */
  return async function listenToTTLChannel(m: unknown) {
    if (!isTTLMessage(m)) {
      return;
    }

    // Remove the shortlink from persisted storage.
    await shorter({
      githubPAT,
      actor: m.data.actor,
      // Omitting the destination will remove the alias.
      data: { alias: m.data.alias },
    })
      .catch((error) => {
        if (error instanceof Error) {
          console.error(error);
        }
      });
  };
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
