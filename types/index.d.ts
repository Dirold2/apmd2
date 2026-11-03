import type { HyperClient } from "hyperttp";
/** A track extracted from a public Apple Music playlist page. */
export interface Track {
    /** One-based position in the playlist. */
    position: number;
    title: string;
    artist: string;
    album?: string;
    durationMs?: number;
    cover?: string;
    /** Apple Music catalogue (Adam) identifier, when Apple exposes one. */
    appleId?: string;
}
export interface AppleMusicPlaylist {
    title?: string;
    tracks: Track[];
    sourceUrl: string;
}
export interface AppleMusicAlbum {
    title: string;
    artists: string[];
    trackCount?: number;
    releaseYear?: number;
    appleId?: string;
    cover?: string;
    tracks: Track[];
    sourceUrl: string;
}
export interface AppleMusicTrack {
    title: string;
    artist: string;
    artists: string[];
    album?: string;
    releaseDate?: string;
    durationMs?: number;
    appleId: string;
    cover?: string;
    sourceUrl: string;
}
export interface AppleMusicSearchTrack {
    appleId: string;
    title: string;
    artist?: string;
    cover?: string;
    url: string;
}
export interface AppleMusicSearchArtist {
    appleId: string;
    name: string;
    url: string;
}
export interface AppleMusicSearchResults {
    query: string;
    storefront: string;
    tracks: AppleMusicSearchTrack[];
    artists: AppleMusicSearchArtist[];
}
export interface AppleMusicSearchOptions {
    /** Apple Music storefront code, for example `ru`, `us`, or `in`. */
    storefront?: string;
    /** Maximum number of tracks and artists returned per type. Defaults to 20. */
    limit?: number;
    signal?: AbortSignal;
}
export interface ImportAppleMusicPlaylistOptions {
    client?: HyperClient;
    signal?: AbortSignal;
}
//# sourceMappingURL=index.d.ts.map