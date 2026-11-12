import type { AppleMusicAlbum, AppleMusicDailyCharts, AppleMusicNewReleases, AppleMusicPlaylist, AppleMusicSearchResults, AppleMusicTrack } from "../types/index.js";
/** The public daily chart catalogue could not be parsed. */
export declare class AppleMusicDailyChartsParseError extends Error {
    constructor(message: string);
}
/** The New This Week room did not contain recognizable album cards. */
export declare class AppleMusicNewReleasesParseError extends Error {
    constructor(message: string);
}
/** The page did not contain the public playlist state expected by this importer. */
export declare class AppleMusicPlaylistParseError extends Error {
    constructor(message: string);
}
/** The page did not contain the public album state expected by this importer. */
export declare class AppleMusicAlbumParseError extends Error {
    constructor(message: string);
}
/** The page did not contain the public track state expected by this importer. */
export declare class AppleMusicTrackParseError extends Error {
    constructor(message: string);
}
/**
 * Validates a public Apple Music playlist URL without assuming a storefront such
 * as `/in/` or `/us/`. The supplied storefront is retained because catalogue
 * availability and track IDs can vary by country.
 */
export declare function normalizeAppleMusicPlaylistUrl(value: string): string;
/** Validates and normalizes a public Apple Music album URL. */
export declare function normalizeAppleMusicAlbumUrl(value: string): string;
/** Validates and normalizes a public Apple Music song URL. */
export declare function normalizeAppleMusicTrackUrl(value: string): string;
/** Parses the server-rendered daily chart catalogue in its original order. */
export declare function parseAppleMusicDailyChartsHtml(html: string, sourceUrl: string): AppleMusicDailyCharts;
/** Parses album cards from the server-rendered New This Week room. */
export declare function parseAppleMusicNewReleasesHtml(html: string, sourceUrl?: string): AppleMusicNewReleases;
/** Parses already-downloaded public Apple Music playlist HTML. */
export declare function parseAppleMusicPlaylistHtml(html: string, sourceUrl?: string): AppleMusicPlaylist;
/** Parses already-downloaded public Apple Music album HTML. */
export declare function parseAppleMusicAlbumHtml(html: string, sourceUrl?: string): AppleMusicAlbum;
/** Parses already-downloaded public Apple Music track HTML. */
export declare function parseAppleMusicTrackHtml(html: string, sourceUrl?: string): AppleMusicTrack;
/** Parses already-downloaded public Apple Music search HTML. */
export declare function parseAppleMusicSearchHtml(html: string, query: string, storefront: string, limit: number): AppleMusicSearchResults;
//# sourceMappingURL=index.d.ts.map