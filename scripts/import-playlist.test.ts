import assert from "node:assert/strict";
import test from "node:test";
import { extractPlaylistId, fetchPlaylist, generatePlaylistSource } from "./import-playlist.ts";

test("extracts YouTube and YouTube Music playlist IDs", () => {
  assert.equal(extractPlaylistId("https://www.youtube.com/playlist?list=PL_test-123"), "PL_test-123");
  assert.equal(extractPlaylistId("https://music.youtube.com/playlist?list=PL_music_456"), "PL_music_456");
  assert.throws(() => extractPlaylistId("https://example.com/playlist?list=PL123"), /Unsupported/);
  assert.throws(() => extractPlaylistId("https://youtube.com/playlist"), /valid YouTube playlist ID/);
});

test("paginates, preserves order, and skips unavailable items", async () => {
  const responses = [
    { nextPageToken: "page-2", items: [
      { snippet: { title: "First", thumbnails: { high: { url: "https://img/first.jpg" } } }, contentDetails: { videoId: "abcdefghijk" }, status: { privacyStatus: "public" } },
      { snippet: { title: "Private video" }, contentDetails: {}, status: { privacyStatus: "private" } },
    ] },
    { items: [{ snippet: { title: "Second" }, contentDetails: { videoId: "lmnopqrstuv" }, status: { privacyStatus: "public" } }] },
  ];
  let call = 0;
  const mockFetch = async () => new Response(JSON.stringify(responses[call++]), { status: 200, headers: { "content-type": "application/json" } });
  const result = await fetchPlaylist("PL_test", "secret", mockFetch);
  assert.deepEqual(result.pages, [2, 1]);
  assert.equal(result.skipped, 1);
  assert.deepEqual(result.tracks.map((track) => track.title), ["First", "Second"]);
  assert.match(generatePlaylistSource(result.tracks), /youtubeVideoId: "abcdefghijk"/);
  assert.doesNotMatch(generatePlaylistSource(result.tracks), /artist:/);
});
