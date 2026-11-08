import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AppleMusicAlbumParseError,
  AppleMusicPlaylistParseError,
  AppleMusicTrackParseError,
  parseAppleMusicAlbumHtml,
  parseAppleMusicPlaylistHtml,
  parseAppleMusicSearchHtml,
  parseAppleMusicTrackHtml,
} from "../src/index.js";

const script = (value: unknown) => `<script type="application/json">${JSON.stringify(value)}</script>`;
const invalidScript = '<script type="application/json">not json</script>';
const artwork = { dictionary: { url: "https://example.com/{w}x{h}.{f}" } };
const cover = "https://example.com/1200x1200.jpg";
const source = "https://music.apple.com/us/example";
const lockups = [
  { id: "track-lockup - 1", title: " First ", artistName: " Artist ", duration: 1234, tertiaryLinks: [{ title: " Album " }], artwork, contentDescriptor: { identifiers: { storeAdamID: 42 } } },
  { id: "track-lockup - 2", title: "Second", subtitleLinks: [{ title: "Guest" }] },
];
const tracks = [
  { position: 1, title: "First", artist: "Artist", album: "Album", cover, durationMs: 1234, appleId: "42" },
  { position: 2, title: "Second", artist: "Guest", album: undefined, cover: undefined, durationMs: undefined, appleId: undefined },
];

test("track: extracts nested song metadata and ISO duration", () => {
  const detail = { title: " Song ", artists: " Artist & Guest ", artistLinks: [{ title: "Artist" }, { title: " Guest " }], album: " Album ", releaseDate: "2024-01-02", artwork, contentDescriptor: { kind: "song", identifiers: { storeAdamID: 123 } } };
  const html = `<meta property="music:song:duration" content="PT1H2M3.5S">${invalidScript}${script({ nested: [detail] })}`;
  assert.deepEqual(parseAppleMusicTrackHtml(html, source), {
    title: "Song", artist: "Artist & Guest", artists: ["Artist", "Guest"], album: "Album", releaseDate: "2024-01-02", durationMs: 3723500, appleId: "123", cover, sourceUrl: source,
  });
  const fallback = parseAppleMusicTrackHtml(script({ ...detail, artistLinks: [] }), source);
  assert.deepEqual(fallback.artists, ["Artist & Guest"]);
  assert.equal(fallback.durationMs, undefined);
  assert.throws(() => parseAppleMusicTrackHtml(script({ ...detail, contentDescriptor: { kind: "song" } })), AppleMusicTrackParseError);
});

test("album: extracts header and ordered tracks, ignoring malformed scripts", () => {
  const header = { id: "album-detail-header - 10", title: " Record ", subtitleLinks: [{ title: " Artist " }, { title: " " }], quaternaryTitle: "Released 2023", trackCount: 2, artwork, contentDescriptor: { identifiers: { storeAdamID: 10 } } };
  assert.deepEqual(parseAppleMusicAlbumHtml(invalidScript + script({ data: { header, lockups } }), source), {
    title: "Record", artists: ["Artist"], trackCount: 2, releaseYear: 2023, appleId: "10", cover, tracks, sourceUrl: source,
  });
  assert.throws(() => parseAppleMusicAlbumHtml(script({ header })), AppleMusicAlbumParseError);
  assert.throws(() => parseAppleMusicAlbumHtml(script({ lockups })), AppleMusicAlbumParseError);
});

test("playlist: extracts ordered tracks and title, with metadata fallback", () => {
  const state = { header: { id: "playlist-detail-header - pl.1", title: " Mix " }, items: lockups };
  assert.deepEqual(parseAppleMusicPlaylistHtml(invalidScript + script(state), source), { title: "Mix", tracks, sourceUrl: source });
  const fallback = parseAppleMusicPlaylistHtml('<meta property="og:title" content="Fallback">' + script({ items: lockups }), source);
  assert.equal(fallback.title, "Fallback");
  assert.throws(() => parseAppleMusicPlaylistHtml(script({ items: [{ id: "track-lockup - 1", title: "No artist" }] })), AppleMusicPlaylistParseError);
});

test("search: normalizes, deduplicates and limits songs and artists independently", () => {
  const result = (kind: string, id: number, title: string, url: string, extra = {}) => ({ title, contentDescriptor: { kind, url, identifiers: { storeAdamID: id } }, ...extra });
  const song = result("song", 1, " Song ", "https://music.apple.com/song/1", { subtitle: "Song · Artist", artwork });
  const artist = result("artist", 1, " Artist ", "https://music.apple.com/artist/1");
  const html = invalidScript + script({ results: [song, song, result("song", 2, "Other", "url"), artist, artist, result("artist", 2, "Other artist", "url"), result("song", 3, "Missing URL", "")] });
  assert.deepEqual(parseAppleMusicSearchHtml(html, "query", "us", 1), {
    query: "query", storefront: "us",
    tracks: [{ appleId: "1", title: "Song", artist: "Artist", cover, url: "https://music.apple.com/song/1" }],
    artists: [{ appleId: "1", name: "Artist", url: "https://music.apple.com/artist/1" }],
  });
  const all = parseAppleMusicSearchHtml(html, "query", "us", 10);
  assert.deepEqual(all.tracks.map((item) => item.appleId), ["1", "2"]);
  assert.deepEqual(all.artists.map((item) => item.appleId), ["1", "2"]);
  assert.deepEqual(parseAppleMusicSearchHtml("<html></html>", "none", "us", 5), { query: "none", storefront: "us", tracks: [], artists: [] });
});
