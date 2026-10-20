import type { AppleMusicAlbum, AppleMusicPlaylist, AppleMusicSearchResults, AppleMusicTrack } from "../types/index.js";
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
/** Parses already-downloaded public Apple Music playlist HTML. */
export declare function parseAppleMusicPlaylistHtml(html: string, sourceUrl?: string): AppleMusicPlaylist;
/** Parses already-downloaded public Apple Music album HTML. */
export declare function parseAppleMusicAlbumHtml(html: string, sourceUrl?: string): AppleMusicAlbum;
/** Parses already-downloaded public Apple Music track HTML. */
export declare function parseAppleMusicTrackHtml(html: string, sourceUrl?: string): AppleMusicTrack;
/** Parses already-downloaded public Apple Music search HTML. */
export declare function parseAppleMusicSearchHtml(html: string, query: string, storefront: string, limit: number): AppleMusicSearchResults;
//# sourceMappingURL=index.d.ts.map