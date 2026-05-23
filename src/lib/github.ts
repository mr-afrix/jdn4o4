/**
 * GitHub API service — fetches real data from github.com/jdn404
 */

export const GITHUB_USERNAME = "jdn404";
const API = "https://api.github.com";

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  blog: string;
  hireable: boolean | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  topics: string[];
  pushed_at: string;
  archived: boolean;
}

export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219",
  "C++": "#f34b7d", C: "#555555", "C#": "#178600", Ruby: "#701516", Go: "#00ADD8",
  Rust: "#dea584", Swift: "#F05138", Kotlin: "#A97BFF", PHP: "#4F5D95", HTML: "#e34c26",
  CSS: "#563d7c", SCSS: "#c6538c", Shell: "#89e051", Vue: "#41b883", Svelte: "#ff3e00",
  Dart: "#00B4AB", Lua: "#000080", Dockerfile: "#384d54", Jupyter: "#DA5B0B",
  default: "#8b8b8b",
};

const TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;

async function gh<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
  if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Not found: ${path}`);
    if (res.status === 403) throw new Error("GitHub API rate limit hit. Try again in a few minutes.");
    throw new Error(`GitHub error ${res.status}`);
  }
  return res.json();
}

export const fetchUser = (u = GITHUB_USERNAME) => gh<GitHubUser>(`/users/${u}`);
export const fetchRepos = (u = GITHUB_USERNAME) =>
  gh<GitHubRepo[]>(`/users/${u}/repos?per_page=100&sort=updated`);

export const totalStars = (r: GitHubRepo[]) => r.filter(x => !x.fork).reduce((s, x) => s + x.stargazers_count, 0);
export const totalForks = (r: GitHubRepo[]) => r.filter(x => !x.fork).reduce((s, x) => s + x.forks_count, 0);

export function languageBreakdown(repos: GitHubRepo[]) {
  const counts: Record<string, number> = {};
  repos.filter(r => !r.fork).forEach((r) => { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / total) * 100,
      color: LANGUAGE_COLORS[name] || LANGUAGE_COLORS.default,
    }))
    .sort((a, b) => b.count - a.count);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const u: [string, number][] = [["y", 31536000], ["mo", 2592000], ["w", 604800], ["d", 86400], ["h", 3600], ["m", 60]];
  for (const [l, sec] of u) { const n = Math.floor(s / sec); if (n >= 1) return `${n}${l} ago`; }
  return "just now";
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string; url: string };
  payload: any;
}

export const fetchEvents = (u = GITHUB_USERNAME) =>
  gh<GitHubEvent[]>(`/users/${u}/events/public?per_page=100`);

export function buildActivityBuckets(events: GitHubEvent[], days = 14) {
  const buckets: { day: string; commits: number; events: number; date: Date }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0,0,0,0);
    buckets.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0,1),
      commits: 0, events: 0, date: d,
    });
  }
  events.forEach((e) => {
    const d = new Date(e.created_at); d.setHours(0,0,0,0);
    const b = buckets.find((x) => x.date.getTime() === d.getTime());
    if (!b) return;
    b.events += 1;
    if (e.type === "PushEvent") b.commits += e.payload?.commits?.length || 1;
  });
  return buckets;
}

export function eventStats(events: GitHubEvent[]) {
  const stats = { push: 0, pr: 0, issue: 0, star: 0, create: 0, commits: 0 };
  events.forEach((e) => {
    if (e.type === "PushEvent") { stats.push++; stats.commits += e.payload?.commits?.length || 1; }
    else if (e.type === "PullRequestEvent") stats.pr++;
    else if (e.type === "IssuesEvent") stats.issue++;
    else if (e.type === "WatchEvent") stats.star++;
    else if (e.type === "CreateEvent") stats.create++;
  });
  return stats;
}

export function eventLabel(e: GitHubEvent): string {
  switch (e.type) {
    case "PushEvent": return `pushed ${e.payload?.commits?.length || 0} commit${(e.payload?.commits?.length || 0) === 1 ? "" : "s"} to`;
    case "PullRequestEvent": return `${e.payload?.action || "updated"} PR in`;
    case "IssuesEvent": return `${e.payload?.action || "updated"} issue in`;
    case "WatchEvent": return `starred`;
    case "CreateEvent": return `created ${e.payload?.ref_type || "ref"} in`;
    case "ForkEvent": return `forked`;
    case "ReleaseEvent": return `released in`;
    default: return e.type.replace("Event", "").toLowerCase();
  }
}

/** Build a 12-week contribution heatmap-ish series from public events. */
export function buildContributionWeeks(events: GitHubEvent[], weeks = 12) {
  const days = weeks * 7;
  const map = new Map<string, number>();
  const now = new Date(); now.setHours(0,0,0,0);
  for (let i = 0; i < days; i++) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    map.set(d.toDateString(), 0);
  }
  events.forEach((e) => {
    const d = new Date(e.created_at); d.setHours(0,0,0,0);
    const k = d.toDateString();
    if (!map.has(k)) return;
    const w = e.type === "PushEvent" ? (e.payload?.commits?.length || 1) : 1;
    map.set(k, (map.get(k) || 0) + w);
  });
  // newest -> oldest, group into weeks of 7 (col = week, row = weekday)
  const all = Array.from(map.entries())
    .map(([k, v]) => ({ date: new Date(k), value: v }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const cols: { date: Date; value: number }[][] = [];
  for (let i = 0; i < all.length; i += 7) cols.push(all.slice(i, i + 7));
  return cols;
}

export interface DevGrade {
  letter: string;
  score: number; // 0-100
  color: string;
  breakdown: { label: string; value: number; max: number; color: string }[];
}

/** Derive a real grade from public GitHub signals. */
export function computeGrade(repos: GitHubRepo[], events: GitHubEvent[]): DevGrade {
  const stats = eventStats(events);
  const owned = repos.filter((r) => !r.fork);
  const stars = owned.reduce((s, r) => s + r.stargazers_count, 0);
  const forks = owned.reduce((s, r) => s + r.forks_count, 0);
  const langs = new Set(owned.map((r) => r.language).filter(Boolean)).size;

  // Each sub-score is 0..100, weighted.
  const sCommits = Math.min(100, (stats.commits / 60) * 100);
  const sActivity = Math.min(100, (events.length / 80) * 100);
  const sImpact = Math.min(100, ((stars + forks * 2) / 50) * 100);
  const sBreadth = Math.min(100, (langs / 8) * 100);
  const sReach = Math.min(100, ((stats.pr + stats.issue + stats.create) / 25) * 100);

  const score = Math.round(
    sCommits * 0.3 + sActivity * 0.2 + sImpact * 0.25 + sBreadth * 0.15 + sReach * 0.1
  );

  const letter =
    score >= 92 ? "S" :
    score >= 85 ? "A+" :
    score >= 75 ? "A" :
    score >= 65 ? "B+" :
    score >= 55 ? "B" :
    score >= 45 ? "C+" :
    score >= 35 ? "C" :
    score >= 20 ? "D" : "E";

  const color =
    score >= 85 ? "hsl(45 100% 60%)" :
    score >= 65 ? "hsl(155 90% 55%)" :
    score >= 45 ? "hsl(175 85% 50%)" :
    score >= 25 ? "hsl(280 75% 60%)" : "hsl(0 75% 60%)";

  return {
    letter, score, color,
    breakdown: [
      { label: "commits",  value: Math.round(sCommits),  max: 100, color: "hsl(155 90% 55%)" },
      { label: "activity", value: Math.round(sActivity), max: 100, color: "hsl(175 85% 50%)" },
      { label: "impact",   value: Math.round(sImpact),   max: 100, color: "hsl(45 100% 60%)" },
      { label: "breadth",  value: Math.round(sBreadth),  max: 100, color: "hsl(280 75% 60%)" },
      { label: "reach",    value: Math.round(sReach),    max: 100, color: "hsl(210 100% 60%)" },
    ],
  };
}
