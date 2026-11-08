import { parse } from "node-html-parser";

import type {
  AppleMusicAlbum,
  AppleMusicDailyCharts,
  AppleMusicNewReleases,
  AppleMusicPlaylist,
  AppleMusicSearchArtist,
  AppleMusicSearchResults,
  AppleMusicSearchTrack,
  AppleMusicTrack,
  Track,
} from "../types/index.js";

/** The public daily chart catalogue could not be parsed. */
export class AppleMusicDailyChartsParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppleMusicDailyChartsParseError";
  }
}

/** The New This Week room did not contain recognizable album cards. */
export class AppleMusicNewReleasesParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppleMusicNewReleasesParseError";
  }
}

/** The page did not contain the public playlist state expected by this importer. */
export class AppleMusicPlaylistParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppleMusicPlaylistParseError";
  }
}

/** The page did not contain the public album state expected by this importer. */
export class AppleMusicAlbumParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppleMusicAlbumParseError";
  }
}

/** The page did not contain the public track state expected by this importer. */
export class AppleMusicTrackParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppleMusicTrackParseError";
  }
}

type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;
type JsonObject = { [key: string]: JsonValue };

interface SerializedTrack {
  id?: string;
  title?: string;
  duration?: number;
  artistName?: string;
  tertiaryLinks?: Array<{ title?: string }>;
  subtitleLinks?: Array<{ title?: string }>;
  artwork?: {
    dictionary?: {
      url?: unknown;
    };
  };
  contentDescriptor?: {
    identifiers?: {
      storeAdamID?: string | number;
    };
  };
}

interface SerializedAlbumHeader {
  id?: string;
  title?: string;
  subtitleLinks?: Array<{ title?: string }>;
  quaternaryTitle?: string;
  trackCount?: number;
  artwork?: {
    dictionary?: {
      url?: unknown;
    };
  };
  contentDescriptor?: {
    identifiers?: {
      storeAdamID?: string | number;
    };
  };
}

interface SerializedSongDetail {
  title?: string;
  artists?: string;
  artistLinks?: Array<{ title?: string }>;
  album?: string;
  releaseDate?: string;
  artwork?: {
    dictionary?: {
      url?: unknown;
    };
  };
  contentDescriptor?: {
    kind?: string;
    identifiers?: {
      storeAdamID?: string | number;
    };
  };
}

interface SerializedSearchResult {
  title?: string;
  subtitle?: string | null;
  artwork?: {
    dictionary?: {
      url?: unknown;
    };
  };
  contentDescriptor?: {
    kind?: string;
    url?: string;
    identifiers?: {
      storeAdamID?: string | number;
    };
  };
}

/**
 * Validates a public Apple Music playlist URL without assuming a storefront such
 * as `/in/` or `/us/`. The supplied storefront is retained because catalogue
 * availability and track IDs can vary by country.
 */
export function normalizeAppleMusicPlaylistUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new TypeError("Apple Music playlist URL must be an absolute URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new TypeError("Apple Music playlist URL must use HTTP or HTTPS.");
  }

  if (url.hostname !== "music.apple.com" && url.hostname !== "www.music.apple.com") {
    throw new TypeError("Apple Music playlist URL must use music.apple.com.");
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);
  const playlistIndex = pathSegments.indexOf("playlist");
  if (playlistIndex === -1 || pathSegments.length <= playlistIndex + 2) {
    throw new TypeError("URL does not identify an Apple Music playlist.");
  }

  url.protocol = "https:";
  url.hostname = "music.apple.com";
  url.search = "";
  url.hash = "";
  return url.toString();
}

/** Validates and normalizes a public Apple Music album URL. */
export function normalizeAppleMusicAlbumUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new TypeError("Apple Music album URL must be an absolute URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new TypeError("Apple Music album URL must use HTTP or HTTPS.");
  }

  if (url.hostname !== "music.apple.com" && url.hostname !== "www.music.apple.com") {
    throw new TypeError("Apple Music album URL must use music.apple.com.");
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);
  const albumIndex = pathSegments.indexOf("album");
  if (albumIndex === -1 || pathSegments.length <= albumIndex + 2) {
    throw new TypeError("URL does not identify an Apple Music album.");
  }

  url.protocol = "https:";
  url.hostname = "music.apple.com";
  url.search = "";
  url.hash = "";
  return url.toString();
}

/** Validates and normalizes a public Apple Music song URL. */
export function normalizeAppleMusicTrackUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new TypeError("Apple Music track URL must be an absolute URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new TypeError("Apple Music track URL must use HTTP or HTTPS.");
  }

  if (url.hostname !== "music.apple.com" && url.hostname !== "www.music.apple.com") {
    throw new TypeError("Apple Music track URL must use music.apple.com.");
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);
  const songIndex = pathSegments.indexOf("song");
  if (songIndex === -1 || pathSegments.length <= songIndex + 2) {
    throw new TypeError("URL does not identify an Apple Music track.");
  }

  url.protocol = "https:";
  url.hostname = "music.apple.com";
  url.search = "";
  url.hash = "";
  return url.toString();
}

/** Parses the server-rendered daily chart catalogue in its original order. */
export function parseAppleMusicDailyChartsHtml(html: string, sourceUrl: string): AppleMusicDailyCharts {
  const document = parse(html);
  const charts: AppleMusicDailyCharts["charts"] = [];
  const seen = new Set<string>();

  for (const link of document.querySelectorAll("a[data-testid='product-lockup-title']")) {
    const href = link.getAttribute("href");
    const title = link.textContent.trim();
    if (!href || !title) continue;
    try {
      const url = normalizeAppleMusicPlaylistUrl(new URL(href, sourceUrl).toString());
      if (!seen.has(url)) {
        seen.add(url);
        charts.push({ title, url });
      }
    } catch {
      // Ignore links that do not identify public Apple Music playlists.
    }
  }

  if (charts.length === 0) {
    throw new AppleMusicDailyChartsParseError("No daily chart playlists were found on the Apple Music page. The page may be unavailable or its format may have changed.");
  }
  return { sourceUrl, charts };
}

/** Parses album cards from the server-rendered New This Week room. */
export function parseAppleMusicNewReleasesHtml(html: string, sourceUrl = "https://music.apple.com/uz/room/6831472600"): AppleMusicNewReleases {
  const document = parse(html);
  const albums: AppleMusicNewReleases["albums"] = [];
  const seen = new Set<string>();
  for (const card of document.querySelectorAll("[data-testid='product-lockup']")) {
    const link = card.querySelector("a[data-testid='product-lockup-title']");
    const href = link?.getAttribute("href");
    const title = link?.textContent.trim();
    if (!href || !title) continue;
    try {
      const url = normalizeAppleMusicAlbumUrl(new URL(href, sourceUrl).toString());
      const path = new URL(url).pathname;
      const match = /^\/[a-z]{2}(?:-[a-z]{2})?\/album\/[^/]+\/(\d+)\/?$/i.exec(path);
      const appleId = match?.[1];
      if (!appleId || seen.has(appleId)) continue;
      seen.add(appleId);
      const artists = card.querySelectorAll("[data-testid='product-lockup-subtitle']")
        .map((artist) => artist.textContent.trim()).filter(Boolean);
      const srcset = card.querySelector("picture source[srcset]")?.getAttribute("srcset");
      const candidate = srcset?.split(",")[0]?.trim().split(/\s+/)[0];
      let cover: string | undefined;
      if (candidate) {
        const image = new URL(candidate, sourceUrl);
        if (image.protocol === "https:" && /(?:^|\.)mzstatic\.com$/i.test(image.hostname)) cover = image.toString();
      }
      albums.push({ appleId, title, artists, url, ...(cover ? { cover } : {}) });
    } catch {
      // Ignore malformed or non-Apple album links.
    }
  }
  if (albums.length === 0) {
    throw new AppleMusicNewReleasesParseError("No album cards were found in the Apple Music New This Week room. The page may be unavailable or its format may have changed.");
  }
  return { sourceUrl, albums };
}

/** Parses already-downloaded public Apple Music playlist HTML. */
export function parseAppleMusicPlaylistHtml(html: string, sourceUrl = "https://music.apple.com/"): AppleMusicPlaylist {
  const document = parse(html);
  const serializedStates = document.querySelectorAll("script[type='application/json']");
  const fallbackTitle = readMetaContent(document, "apple:title") ?? readMetaContent(document, "og:title");

  for (const state of serializedStates) {
    const json = tryParseJson(state.textContent);
    if (json === undefined) {
      continue;
    }

    const tracks = extractTracks(json);
    if (tracks.length > 0) {
      return { title: extractPlaylistTitle(json) ?? fallbackTitle, tracks, sourceUrl };
    }
  }

  throw new AppleMusicPlaylistParseError(
    "No playlist tracks were found in the public Apple Music page. The playlist may be private, unavailable in this storefront, or Apple may have changed its page format.",
  );
}

/** Parses already-downloaded public Apple Music album HTML. */
export function parseAppleMusicAlbumHtml(html: string, sourceUrl = "https://music.apple.com/"): AppleMusicAlbum {
  const document = parse(html);

  for (const state of document.querySelectorAll("script[type='application/json']")) {
    const json = tryParseJson(state.textContent);
    if (json === undefined) {
      continue;
    }

    const header = findAlbumHeader(json);
    const tracks = extractTracks(json);
    if (header !== undefined && tracks.length > 0) {
      const title = nonEmptyString(header.title);
      if (title !== undefined) {
        const artists = (header.subtitleLinks ?? [])
          .map((link) => nonEmptyString(link.title))
          .filter((artist): artist is string => artist !== undefined);
        const releaseYear = extractYear(header.quaternaryTitle);
        const appleId = header.contentDescriptor?.identifiers?.storeAdamID;
        const cover = getArtworkUrl(header?.artwork?.dictionary?.url);

        return {
          title,
          artists,
          trackCount: header.trackCount,
          releaseYear,
          appleId: appleId === undefined ? undefined : String(appleId),
          cover,
          tracks,
          sourceUrl,
        };
      }
    }
  }

  throw new AppleMusicAlbumParseError(
    "No album tracks were found in the public Apple Music page. The album may be unavailable in this storefront, or Apple may have changed its page format.",
  );
}

/** Parses already-downloaded public Apple Music track HTML. */
export function parseAppleMusicTrackHtml(html: string, sourceUrl = "https://music.apple.com/"): AppleMusicTrack {
  const document = parse(html);
  const durationMs = parseIsoDurationMs(readMetaContent(document, "music:song:duration"));

  for (const state of document.querySelectorAll("script[type='application/json']")) {
    const json = tryParseJson(state.textContent);
    if (json === undefined) {
      continue;
    }


    const detail = findSongDetail(json);
    const cover = getArtworkUrl(detail?.artwork?.dictionary?.url);
    const title = detail === undefined ? undefined : nonEmptyString(detail.title);
    const artist = detail === undefined ? undefined : nonEmptyString(detail.artists);
    const appleId = detail?.contentDescriptor?.identifiers?.storeAdamID;
    if (detail !== undefined && title !== undefined && artist !== undefined && appleId !== undefined) {
      const artists = (detail.artistLinks ?? [])
        .map((link) => nonEmptyString(link.title))
        .filter((item): item is string => item !== undefined);

      return {
        title,
        artist,
        artists: artists.length > 0 ? artists : [artist],
        album: nonEmptyString(detail.album),
        releaseDate: nonEmptyString(detail.releaseDate),
        durationMs,
        appleId: String(appleId),
        cover,
        sourceUrl,
      };
    }
  }

  throw new AppleMusicTrackParseError(
    "No track details were found in the public Apple Music page. The track may be unavailable in this storefront, or Apple may have changed its page format.",
  );
}

function getArtworkUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  return value
    .replaceAll("{w}", "1200")
    .replaceAll("{h}", "1200")
    .replaceAll("{f}", "jpg");
}

/** Parses already-downloaded public Apple Music search HTML. */
export function parseAppleMusicSearchHtml(
  html: string,
  query: string,
  storefront: string,
  limit: number,
): AppleMusicSearchResults {
  const document = parse(html);
  const results: SerializedSearchResult[] = [];

  for (const state of document.querySelectorAll("script[type='application/json']")) {
    const json = tryParseJson(state.textContent);
    if (json !== undefined) {
      findSearchResults(json, results);
    }
  }

  const tracks: AppleMusicSearchTrack[] = [];
  const artists: AppleMusicSearchArtist[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    const normalized = normalizeSearchResult(result);
    if (normalized === undefined || seen.has(`${normalized.kind}:${normalized.appleId}`)) {
      continue;
    }
    seen.add(`${normalized.kind}:${normalized.appleId}`);

    if (normalized.kind === "song" && tracks.length < limit) {
      tracks.push(normalized.value);
    } else if (normalized.kind === "artist" && artists.length < limit) {
      artists.push(normalized.value);
    }

    if (tracks.length === limit && artists.length === limit) {
      break;
    }
  }

  return { query, storefront, tracks, artists };
}

function readMetaContent(document: ReturnType<typeof parse>, property: string): string | undefined {
  return document.querySelector(`meta[property='${property}']`)?.getAttribute("content") ?? undefined;
}

function tryParseJson(value: string): JsonValue | undefined {
  try {
    return JSON.parse(value) as JsonValue;
  } catch {
    return undefined;
  }
}

function findSongDetail(value: JsonValue): SerializedSongDetail | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const detail = findSongDetail(item);
      if (detail !== undefined) {
        return detail;
      }
    }
    return undefined;
  }

  if (!isJsonObject(value)) {
    return undefined;
  }

  const detail = value as SerializedSongDetail;
  if (detail.contentDescriptor?.kind === "song" && typeof detail.title === "string" && typeof detail.artists === "string") {
    return detail;
  }

  for (const child of Object.values(value)) {
    const nestedDetail = findSongDetail(child);
    if (nestedDetail !== undefined) {
      return nestedDetail;
    }
  }

  return undefined;
}

function parseIsoDurationMs(value: string | undefined): number | undefined {
  const match = value?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
  if (match === undefined || match === null) {
    return undefined;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return Math.round((hours * 3_600 + minutes * 60 + seconds) * 1_000);
}

function findAlbumHeader(value: JsonValue): SerializedAlbumHeader | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const header = findAlbumHeader(item);
      if (header !== undefined) {
        return header;
      }
    }
    return undefined;
  }

  if (!isJsonObject(value)) {
    return undefined;
  }

  if (typeof value.id === "string" && value.id.startsWith("album-detail-header - ")) {
    return value as SerializedAlbumHeader;
  }

  for (const child of Object.values(value)) {
    const header = findAlbumHeader(child);
    if (header !== undefined) {
      return header;
    }
  }

  return undefined;
}

function extractYear(value: string | undefined): number | undefined {
  const match = value?.match(/\b(?:19|20)\d{2}\b/);
  return match?.[0] === undefined ? undefined : Number(match[0]);
}

function findSearchResults(value: JsonValue, results: SerializedSearchResult[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      findSearchResults(item, results);
    }
    return;
  }

  if (!isJsonObject(value)) {
    return;
  }

  const result = value as SerializedSearchResult;
  if (result.contentDescriptor?.kind === "song" || result.contentDescriptor?.kind === "artist") {
    results.push(result);
    return;
  }

  for (const child of Object.values(value)) {
    findSearchResults(child, results);
  }
}

type NormalizedSearchResult =
  | { kind: "song"; appleId: string; value: AppleMusicSearchTrack }
  | { kind: "artist"; appleId: string; value: AppleMusicSearchArtist };

function normalizeSearchResult(result: SerializedSearchResult): NormalizedSearchResult | undefined {
  const title = nonEmptyString(result.title);
  const cover = getArtworkUrl(result?.artwork?.dictionary?.url);
  const descriptor = result.contentDescriptor;
  const appleId = descriptor?.identifiers?.storeAdamID;
  const url = nonEmptyString(descriptor?.url);

  if (title === undefined || descriptor === undefined || appleId === undefined || url === undefined) {
    return undefined;
  }

  const id = String(appleId);
  if (descriptor.kind === "song") {
    return {
      kind: "song",
      appleId: id,
      value: { appleId: id, title, artist: artistFromSearchSubtitle(result.subtitle), cover, url },
    };
  }

  if (descriptor.kind === "artist") {
    return { kind: "artist", appleId: id, value: { appleId: id, name: title, url } };
  }

  return undefined;
}

function artistFromSearchSubtitle(subtitle: string | null | undefined): string | undefined {
  const separator = subtitle?.indexOf("·");
  return separator === undefined || separator === -1 ? undefined : nonEmptyString(subtitle?.slice(separator + 1));
}

function extractPlaylistTitle(state: JsonValue): string | undefined {
  if (Array.isArray(state)) {
    for (const item of state) {
      const title = extractPlaylistTitle(item);
      if (title !== undefined) {
        return title;
      }
    }
    return undefined;
  }

  if (!isJsonObject(state)) {
    return undefined;
  }

  if (typeof state.id === "string" && state.id.startsWith("playlist-detail-header - ")) {
    return nonEmptyString(state.title as string | undefined);
  }

  for (const child of Object.values(state)) {
    const title = extractPlaylistTitle(child);
    if (title !== undefined) {
      return title;
    }
  }

  return undefined;
}

function extractTracks(state: JsonValue): Track[] {
  const lockups: SerializedTrack[] = [];
  findTrackLockups(state, lockups);

  return lockups.flatMap((track, index) => {
    const normalized = normalizeTrack(track, index + 1);
    return normalized === undefined ? [] : [normalized];
  });
}

function findTrackLockups(value: JsonValue, lockups: SerializedTrack[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      findTrackLockups(item, lockups);
    }
    return;
  }

  if (!isJsonObject(value)) {
    return;
  }

  if (isTrackLockup(value)) {
    lockups.push(value);
    return;
  }

  for (const child of Object.values(value)) {
    findTrackLockups(child, lockups);
  }
}

function isTrackLockup(value: JsonObject): value is JsonObject & SerializedTrack {
  return typeof value.id === "string" && value.id.startsWith("track-lockup - ");
}

function normalizeTrack(track: SerializedTrack, position: number): Track | undefined {
  const title = nonEmptyString(track.title);
  const artist = nonEmptyString(track.artistName) ?? nonEmptyString(track.subtitleLinks?.[0]?.title);
  const cover = getArtworkUrl(track?.artwork?.dictionary?.url);
  if (title === undefined || artist === undefined) {
    return undefined;
  }

  const durationMs = typeof track.duration === "number" && Number.isFinite(track.duration) ? track.duration : undefined;
  const appleId = track.contentDescriptor?.identifiers?.storeAdamID;

  return {
    position,
    title,
    artist,
    album: nonEmptyString(track.tertiaryLinks?.[0]?.title),
    cover,
    durationMs,
    appleId: appleId === undefined ? undefined : String(appleId),
  };
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === "" || trimmed === undefined ? undefined : trimmed;
}
