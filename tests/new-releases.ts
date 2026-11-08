import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { HyperClient } from "hyperttp";
import { APMApi, AppleMusicNewReleasesParseError, parseAppleMusicNewReleasesHtml } from "../src/index.js";

const source = "https://music.apple.com/uz/room/6831472600";
const html = readFileSync(new URL("./fixtures/new-releases.html", import.meta.url), "utf8");

test("parses server-rendered album cards, preserving order and deduplicating IDs", () => {
  assert.deepEqual(parseAppleMusicNewReleasesHtml(html), { sourceUrl: source, albums: [
    { appleId: "6802901441", title: "O My Beloved", artists: ["Kings of Leon"], url: "https://music.apple.com/uz/album/o-my-beloved/6802901441", cover: "https://is1-ssl.mzstatic.com/image/thumb/example/296x296.webp" },
    { appleId: "123", title: "Rock & Roll", artists: ["One", "Two"], url: "https://music.apple.com/uz/album/other/123" },
  ] });
  assert.throws(() => parseAppleMusicNewReleasesHtml("<html></html>"), AppleMusicNewReleasesParseError);
});

test("one request, inflight deduplication, cache, cancellation and storefront validation", async () => {
  const calls: Array<[string, AbortSignal | undefined]> = [];
  const client = { get: async (url: string, _type: string, signal?: AbortSignal) => {
    calls.push([url, signal]);
    await new Promise((resolve) => setTimeout(resolve, 5));
    return html;
  } } as unknown as HyperClient;
  const api = new APMApi(client);
  const [a, b] = await Promise.all([api.getNewReleases(), api.getNewReleases()]);
  assert.deepEqual(a, b);
  await api.getNewReleases();
  assert.equal(calls.length, 1);
  const signal = new AbortController().signal;
  await api.getNewReleases({ storefront: "UZ", signal });
  assert.deepEqual(calls[1], [source, signal]);
  await assert.rejects(api.getNewReleases({ storefront: "../us" }), TypeError);
});

test("failed requests are not cached", async () => {
  let count = 0;
  const client = { get: async () => ++count === 1 ? "<html></html>" : html } as unknown as HyperClient;
  const api = new APMApi(client);
  await assert.rejects(api.getNewReleases(), AppleMusicNewReleasesParseError);
  assert.equal((await api.getNewReleases()).albums.length, 2);
  assert.equal(count, 2);
});
