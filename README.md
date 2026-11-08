# apmd2

Utilities for reading public Apple Music playlist pages without an Apple Music developer token.

> This is an HTML scraper, not the official Apple Music API. Apple can change its page format or restrict access at any time. Do not use it for private playlists or user-library data.

## Install

```sh
npm install apmd2
```

## Import a public playlist

```ts
import { importAppleMusicPlaylist } from "apmd2";

const playlist = await importAppleMusicPlaylist(
  "https://music.apple.com/in/playlist/favourite-songs/pl.u-m6UNbABq39",
);

console.log(playlist.title);
console.log(playlist.tracks[0]);
// {
//   position: 1,
//   title: "We Are The People",
//   artist: "Empire Of The Sun",
//   album: "We Are The People (Reimagined) - EP",
//   durationMs: 272175,
//   appleId: "1803037506"
// }
```

The importer keeps the storefront from the URL (for example, `/in/` or `/us/`) but does not otherwise depend on a fixed country code. It removes query and fragment parameters before fetching.

## Get a public track

```ts
import { APMApi } from "apmd2";

const track = await new APMApi().getTrack(
  "https://music.apple.com/ru/song/on-on/1807345148",
);

console.log(track.title); // On & On
console.log(track.artists); // ["Chris Lake", "Yael Watchman"]
```

## Get a public album

```ts
import { APMApi } from "apmd2";

const album = await new APMApi().getAlbum(
  "https://music.apple.com/ru/album/chemistry/1807345147",
);

console.log(album.title); // Chemistry
console.log(album.tracks);
```

For tests or cached HTML, use `parseAppleMusicPlaylistHtml(html, sourceUrl)` directly. This avoids an HTTP request while returning the same `AppleMusicPlaylist` shape.

## Daily Top 100 charts

```ts
const api = new APMApi();
const catalogue = await api.getDailyCharts({ storefront: "us" });
console.log(catalogue.charts); // ordered playlist titles and URLs
const global = await api.getDailyGlobalTopChart();
console.log(global.tracks); // positions reflect playlist order
const russia = await api.getDailyRussiaTopChart();
console.log(russia.tracks);
```

These methods scrape the public `/us/new/top-charts/daily-global-top-charts` page and, for the global and Russia charts, their linked Top 100 playlists. The catalogue is not itself a list of songs. `storefront` defaults to `us`; availability and page language may vary by storefront. Only the entries in the server-rendered HTML are returned: Apple currently renders an initial subset, so this is not guaranteed to include every country. The playlist parser likewise returns the tracks present in the public page, not a guaranteed full 100. Apple can change the HTML, playlist ID, availability, or update schedule without notice. No historical dates, chart movements or stream counts are provided. Without a signal, results are cached for 60 seconds and concurrent requests are shared; supplying a signal bypasses the cache for both requests.

The official [Apple Music API](https://developer.apple.com/documentation/applemusicapi/) is a separate API requiring a developer token; its catalogue charts should not be assumed equivalent to this curated daily playlist.

## Search tracks and artists

```ts
import { APMApi } from "apmd2";

const api = new APMApi();
const results = await api.search("Daft Punk", {
  storefront: "ru",
  limit: 10,
});

console.log(results.tracks);
console.log(results.artists);
```

`search` returns tracks and artists only. `storefront` defaults to `"ru"`; `limit` is independently applied to each result type and must be between 1 and 20.

## New This Week albums

```ts
const releases = await new APMApi().getNewReleases({ storefront: "uz" });
console.log(releases.albums); // { appleId, title, artists, url, cover? }[]
```

`getNewReleases({ storefront?, signal? })` defaults to `uz` and reads album cards from the public New This Week room in a single request. It returns `{ sourceUrl, albums }`; the cards do not include track lists or release dates. Use `getAlbum(url)` separately for full album details. Results are cached for 60 seconds and concurrent requests are shared; supplying a signal bypasses both. `parseAppleMusicNewReleasesHtml(html, sourceUrl?)` parses already-downloaded HTML and throws `AppleMusicNewReleasesParseError` if no cards are found. Availability and page structure are controlled by Apple.
