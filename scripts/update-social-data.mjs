import { readFile, writeFile } from 'node:fs/promises';

const outputUrl = new URL('../data/social.json', import.meta.url);
const previous = JSON.parse(await readFile(outputUrl, 'utf8'));
const next = structuredClone(previous);

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const endpoint = new URL(url);
    throw new Error(`${endpoint.origin}${endpoint.pathname} returned ${response.status}`);
  }
  return response.json();
};

const decodeXml = value => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const updateLatestVideoFromFeed = async channelId => {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const response = await fetch(feedUrl);
  if (!response.ok) throw new Error(`${feedUrl} returned ${response.status}`);
  const xml = await response.text();
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  if (!entry) throw new Error('The YouTube video feed is empty.');
  const read = pattern => entry.match(pattern)?.[1];
  const videoId = read(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  const title = read(/<title>([\s\S]*?)<\/title>/);
  if (!videoId || !title) throw new Error('The latest YouTube feed entry is incomplete.');
  next.youtube.latestVideo = {
    id: videoId,
    title: decodeXml(title),
    url: `https://www.youtube.com/watch?v=${videoId}`,
    publishedAt: read(/<published>([^<]+)<\/published>/),
    thumbnail: read(/<media:thumbnail url="([^"]+)"/)
  };
};

const updateYouTube = async () => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY is not configured; keeping the cached subscriber count and refreshing the public video feed.');
    await updateLatestVideoFromFeed(previous.youtube.channelId);
    return;
  }

  const handle = process.env.YOUTUBE_CHANNEL_HANDLE || '@纸巾Paper';
  const channelParams = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    forHandle: handle,
    key: apiKey
  });
  const channelData = await fetchJson(`https://www.googleapis.com/youtube/v3/channels?${channelParams}`);
  const channel = channelData.items?.[0];
  if (!channel) throw new Error(`No YouTube channel found for ${handle}`);

  const uploadsPlaylist = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylist) throw new Error('The YouTube uploads playlist is unavailable.');
  const videoParams = new URLSearchParams({
    part: 'snippet',
    playlistId: uploadsPlaylist,
    maxResults: '1',
    key: apiKey
  });
  const videoData = await fetchJson(`https://www.googleapis.com/youtube/v3/playlistItems?${videoParams}`);
  const video = videoData.items?.[0]?.snippet;
  if (!video?.resourceId?.videoId) throw new Error('The latest YouTube video is unavailable.');

  const videoId = video.resourceId.videoId;
  const thumbnails = video.thumbnails || {};
  const thumbnail = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;
  next.youtube = {
    channelId: channel.id,
    channelUrl: previous.youtube.channelUrl,
    subscribers: Number(channel.statistics?.subscriberCount ?? previous.youtube.subscribers),
    latestVideo: {
      id: videoId,
      title: video.title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt: video.publishedAt,
      thumbnail
    }
  };
};

const updateBilibili = async () => {
  const mid = process.env.BILIBILI_MID || String(previous.bilibili.mid);
  const data = await fetchJson(`https://api.bilibili.com/x/relation/stat?vmid=${encodeURIComponent(mid)}`, {
    headers: {
      Referer: `https://space.bilibili.com/${mid}`,
      'User-Agent': 'Mozilla/5.0 PaperEX-GitHub-Pages-Updater/1.0'
    }
  });
  if (data.code !== 0 || typeof data.data?.follower !== 'number') {
    throw new Error(`Bilibili returned API code ${data.code}`);
  }
  next.bilibili = {
    mid: Number(mid),
    profileUrl: previous.bilibili.profileUrl,
    followers: data.data.follower
  };
};

const updateGitHub = async () => {
  const username = process.env.GITHUB_USERNAME || previous.github?.username || 'Old-Paper';
  const token = process.env.GITHUB_DATA_TOKEN;
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'PaperEX-GitHub-Pages-Updater/1.0'
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const repositories = [];
  for (let page = 1; page <= 10; page += 1) {
    const params = new URLSearchParams({
      type: 'owner',
      sort: 'full_name',
      direction: 'asc',
      per_page: '100',
      page: String(page)
    });
    const batch = await fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}/repos?${params}`, { headers });
    if (!Array.isArray(batch)) throw new Error('GitHub returned an invalid repository list.');
    repositories.push(...batch);
    if (batch.length < 100) break;
  }

  const publicProjects = repositories.filter(repository => (
    !repository.private && !repository.fork && !repository.archived
  )).length;
  next.github = {
    username,
    profileUrl: `https://github.com/${encodeURIComponent(username)}`,
    repositoriesUrl: `https://github.com/${encodeURIComponent(username)}?tab=repositories`,
    publicProjects
  };
};

const results = await Promise.allSettled([updateYouTube(), updateBilibili(), updateGitHub()]);
for (const result of results) {
  if (result.status === 'rejected') console.warn(result.reason?.message || result.reason);
}

const comparable = value => JSON.stringify({ youtube: value.youtube, bilibili: value.bilibili, github: value.github });
next.updatedAt = comparable(next) === comparable(previous) ? previous.updatedAt : new Date().toISOString();
await writeFile(outputUrl, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
console.log(`Social data ready: YouTube ${next.youtube.subscribers}, Bilibili ${next.bilibili.followers}, GitHub ${next.github?.publicProjects ?? 'cached'}`);
