import assert from "node:assert/strict";
import { test } from "node:test";
import type { HyperClient } from "hyperttp";
import { APMApi, AppleMusicDailyChartsParseError, parseAppleMusicDailyChartsHtml } from "../src/index.js";

const source = "https://music.apple.com/us/new/top-charts/daily-global-top-charts";
const globalUrl = "https://music.apple.com/us/playlist/top-100-global/pl.d25f5d1181894928af76c85c967f8f31";
const russiaUrl = "https://music.apple.com/us/playlist/top-100-russia/pl.728bd30a9247487c80a483f4168a9dcd";
const html = `<a data-testid="product-lockup-title" href="${globalUrl}">Top 100: Global</a>
<a data-testid="product-lockup-title" href="${globalUrl}?x=1">Duplicate</a>
<a data-testid="product-lockup-title" href="/us/playlist/top-100-usa/pl.123">Top 100: USA</a>
<a data-testid="product-lockup-title" href="${russiaUrl}">Top 100: Russia</a>
<a data-testid="product-lockup-title" href="https://evil.example/us/playlist/x/pl.123">Bad</a>`;

test("parses and deduplicates chart playlist links in order", () => {
  assert.deepEqual(parseAppleMusicDailyChartsHtml(html, source), { sourceUrl: source, charts: [
    { title: "Top 100: Global", url: globalUrl },
    { title: "Top 100: USA", url: "https://music.apple.com/us/playlist/top-100-usa/pl.123" },
    { title: "Top 100: Russia", url: russiaUrl },
  ] });
  assert.throws(() => parseAppleMusicDailyChartsHtml("<html></html>", source), AppleMusicDailyChartsParseError);
});

test("fetches, deduplicates and caches catalogue; signal bypasses cache", async () => {
  const calls: Array<[string, AbortSignal | undefined]> = [];
  const client = { get: async (url: string, _type: string, signal?: AbortSignal) => {
    calls.push([url, signal]);
    await new Promise((resolve) => setTimeout(resolve, 5));
    return html;
  } } as unknown as HyperClient;
  const api = new APMApi(client);
  const [a, b] = await Promise.all([api.getDailyCharts(), api.getDailyCharts()]);
  assert.deepEqual(a, b);
  assert.equal(calls.length, 1);
  await api.getDailyCharts();
  assert.equal(calls.length, 1);
  const signal = new AbortController().signal;
  await api.getDailyCharts({ storefront: "US", signal });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], [source, signal]);
  await assert.rejects(api.getDailyCharts({ storefront: "../us" }), TypeError);
});

test("global chart resolves the catalogue playlist and propagates signal", async () => {
  const calls: Array<[string, AbortSignal | undefined]> = [];
  const client = { get: async (url: string, _type: string, signal?: AbortSignal) => {
    calls.push([url, signal]);
    if (url === source) return html;
    return `<script type="application/json">${JSON.stringify({ items: [{ id: "track-lockup - 1", title: "Song", artistName: "Artist" }] })}</script>`;
  } } as unknown as HyperClient;
  const signal = new AbortController().signal;
  const chart = await new APMApi(client).getDailyGlobalTopChart({ signal });
  assert.equal(chart.sourceUrl, globalUrl);
  assert.equal(chart.tracks[0]?.title, "Song");
  assert.deepEqual(calls, [[source, signal], [globalUrl, signal]]);
});

test("Russia chart resolves by playlist ID, propagates signal and preserves playlist order", async () => {
  const calls: Array<[string, AbortSignal | undefined]> = [];
  const client = { get: async (url: string, _type: string, signal?: AbortSignal) => {
    calls.push([url, signal]);
    if (url === source) return html.replace("Top 100: Russia", "Localized title");
    assert.equal(url, russiaUrl);
    return `<script type="application/json">${JSON.stringify({ items: [
      { id: "track-lockup - 1", title: "First", artistName: "Artist" },
      { id: "track-lockup - 2", title: "Second", artistName: "Artist" },
    ] })}</script>`;
  } } as unknown as HyperClient;
  const signal = new AbortController().signal;
  const chart = await new APMApi(client).getDailyRussiaTopChart({ storefront: "US", signal });
  assert.equal(chart.sourceUrl, russiaUrl);
  assert.deepEqual(chart.tracks.map((track) => track.title), ["First", "Second"]);
  assert.deepEqual(calls, [[source, signal], [russiaUrl, signal]]);
});

test("Russia chart reports a missing catalogue entry without fetching a playlist", async () => {
  const calls: string[] = [];
  const client = { get: async (url: string) => {
    calls.push(url);
    return html.replace(`<a data-testid="product-lockup-title" href="${russiaUrl}">Top 100: Russia</a>`, "");
  } } as unknown as HyperClient;
  await assert.rejects(new APMApi(client).getDailyRussiaTopChart(), /Russia Top 100 playlist was not found/);
  assert.deepEqual(calls, [source]);
});
