# Changelog

## [1.0.5] (2026-11-08)

### Added

- Added `APMApi.getDailyCharts()` to discover public Daily Top 100 playlists, plus `getDailyGlobalTopChart()` and `getDailyRussiaTopChart()` for their track lists.
- Added `APMApi.getNewReleases()` to read album cards from Apple Music's New This Week room, with `uz` as the default storefront.
- Added HTML parsing helpers, TypeScript models, documentation and tests for daily charts and new releases.
- Added short-lived caching and in-flight request deduplication for the new methods; passing an abort signal bypasses both.

### Notes

- Results depend on the public Apple Music HTML and storefront availability. Chart and playlist pages may expose only a subset of entries; release cards do not include track lists or release dates.

## [1.0.2] (2026-10-29)

### Added

- `APMApi` client for reading public Apple Music pages without a developer token.
- Playlist support via `APMApi.getPlaylist(url)`.
- Album support via `APMApi.getAlbum(url)`.
- Track support via `APMApi.getTrack(url)`.
- Public Apple Music search via `APMApi.search(query, options)`, returning tracks and artists.
- URL normalization and HTML parsing helpers for playlists, albums, tracks, and search pages.
- Short-lived response caches and in-flight request deduplication for API methods.
- TypeScript models for playlists, albums, tracks, and search results.
- Runnable examples for tracks, albums, playlists, and search in `example/`.
