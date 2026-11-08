import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import { HyperClient } from "hyperttp";
import { APMApi } from "../src/index.js";

const playlistUrl = "https://music.apple.com/us/playlist/mix/pl.123";
const playlistHtml = `<script type="application/json">${JSON.stringify({
  header: { id: "playlist-detail-header - pl.123", title: "Mix" },
  items: [{ id: "track-lockup - 1", title: "Song", artistName: "Artist" }],
})}</script>`;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

test("HyperClient retries transient GET responses but not permanent ones", async () => {
  const counts = new Map<string, number>();
  const server = createServer((req, res) => {
    const path = req.url!;
    const count = (counts.get(path) ?? 0) + 1;
    counts.set(path, count);
    res.statusCode = path === "/permanent" ? 404 : path === "/exhausted" || count < 3 ? 503 : 200;
    res.end(res.statusCode === 200 ? "success" : "failure");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const client = new HyperClient({ retry: { maxRetries: 2, baseDelay: 1, maxDelay: 1, jitter: false }, cache: { enabled: false }, inflight: { enabled: false } });
  try {
    assert.equal(await client.get(`${base}/transient`, "text"), "success");
    assert.equal(counts.get("/transient"), 3);
    assert.equal(await client.get(`${base}/exhausted`, "text"), "failure");
    assert.equal(counts.get("/exhausted"), 3);
    assert.equal(await client.get(`${base}/permanent`, "text"), "failure");
    assert.equal(counts.get("/permanent"), 1);
  } finally {
    await client.destroy();
    server.close();
    await once(server, "close");
  }
});

test("playlist shares in-flight work, caches success and bypasses cache for signals", async () => {
  const first = deferred<string>();
  const calls: Array<[string, string, AbortSignal | undefined]> = [];
  const client = { get: (url: string, type: string, signal?: AbortSignal) => {
    calls.push([url, type, signal]);
    return calls.length === 1 ? first.promise : Promise.resolve(playlistHtml);
  } } as unknown as HyperClient;
  const api = new APMApi(client);
  const a = api.getPlaylist(playlistUrl);
  const b = api.getPlaylist(playlistUrl);
  assert.equal(calls.length, 1);
  first.resolve(playlistHtml);
  const [one, two] = await Promise.all([a, b]);
  assert.strictEqual(one, two);
  assert.equal(one.tracks[0]?.title, "Song");
  assert.strictEqual(await api.getPlaylist(playlistUrl), one);
  assert.equal(calls.length, 1);
  const signal = new AbortController().signal;
  const fresh = await api.getPlaylist(playlistUrl, { signal });
  assert.notStrictEqual(fresh, one);
  assert.deepEqual(calls[1], [playlistUrl, "text", signal]);
  assert.strictEqual(await api.getPlaylist(playlistUrl), one);
  assert.equal(calls.length, 2);
});

test("failed shared request is evicted and next call can succeed", async () => {
  const first = deferred<string>();
  const error = new Error("transport failure");
  let calls = 0;
  const client = { get: () => ++calls === 1 ? first.promise : Promise.resolve(playlistHtml) } as unknown as HyperClient;
  const api = new APMApi(client);
  const a = api.getPlaylist(playlistUrl);
  const b = api.getPlaylist(playlistUrl);
  const failures = Promise.allSettled([a, b]);
  first.reject(error);
  const results = await failures;
  for (const result of results) {
    assert.equal(result.status, "rejected");
    if (result.status === "rejected") assert.strictEqual(result.reason, error);
  }
  assert.equal(calls, 1);
  assert.equal((await api.getPlaylist(playlistUrl)).title, "Mix");
  assert.equal(calls, 2);
  await api.getPlaylist(playlistUrl);
  assert.equal(calls, 2);
});

test("signalled requests are independent and an abort does not cancel shared work", async () => {
  const shared = deferred<string>();
  const controller = new AbortController();
  const reason = new Error("cancelled");
  let calls = 0;
  const client = { get: (_url: string, _type: string, signal?: AbortSignal) => {
    calls++;
    if (!signal) return shared.promise;
    return new Promise<string>((resolve, reject) => {
      if (signal.aborted) return reject(signal.reason);
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    });
  } } as unknown as HyperClient;
  const api = new APMApi(client);
  const ordinary = api.getPlaylist(playlistUrl);
  const cancelled = api.getPlaylist(playlistUrl, { signal: controller.signal });
  const rejection = assert.rejects(cancelled, (error) => error === reason);
  assert.equal(calls, 2);
  controller.abort(reason);
  await rejection;
  shared.resolve(playlistHtml);
  const result = await ordinary;
  assert.strictEqual(await api.getPlaylist(playlistUrl), result);
  assert.equal(calls, 2);
});
