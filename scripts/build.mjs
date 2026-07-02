import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const TEMPLATE = path.join(ROOT, "src", "template.html");
const DATA_PATH = process.env.EGC_DATA
  ? path.resolve(process.env.EGC_DATA)
  : fs.existsSync(path.join(ROOT, "data.json"))
    ? path.join(ROOT, "data.json")
    : path.join(ROOT, "data.example.json");

const PERIODS = ["7d", "30d", "90d", "180d", "all"];
const DAY = 86400000;
const WINDOW_DAYS = { "7d": 7, "30d": 30, "90d": 90, "180d": 180 };

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const template = fs.readFileSync(TEMPLATE, "utf8");

validateData(data);
normalizeMembers(data);
deriveTeamTotals(data);
deriveComparisonsAndTrend(data);

const dataLiteral = JSON.stringify(data)
  .replace(/</g, "\\u003c")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(path.join(ROOT, "public"), DIST);
fs.writeFileSync(path.join(DIST, "data.json"), JSON.stringify(data, null, 2) + "\n");
fs.writeFileSync(path.join(DIST, "index.html"), template.replace("__DATA__", dataLiteral));

console.error(`Built dist/index.html from ${path.relative(ROOT, DATA_PATH)} (${data.members.length} members)`);

function validateData(value) {
  if (!value || typeof value !== "object") throw new Error("data must be an object");
  if (!Array.isArray(value.members) || !value.members.length) throw new Error("data.members must be a non-empty array");
  value.periods = Array.isArray(value.periods) && value.periods.length ? value.periods : PERIODS;
  for (const period of value.periods) {
    if (!PERIODS.includes(period)) throw new Error(`unsupported period: ${period}`);
  }
  if (!value.generated_at) value.generated_at = new Date().toISOString();
  if (!value.team || typeof value.team !== "object") value.team = {};
}

function normalizeMembers(value) {
  value.members = value.members.map((member, index) => {
    const name = String(member.name || `Member ${index + 1}`).trim();
    const slug = member.slug || slugFor(name);
    const periods = member.periods || {};
    for (const period of value.periods) {
      periods[period] = normalizePeriod(periods[period]);
    }
    const providedActivity = Array.isArray(member.activity_posts)
      ? member.activity_posts.map(normalizeActivityPost).filter(Boolean)
      : [];
    const activityPosts = providedActivity.length
      ? dedupeActivityPosts(providedActivity)
      : activityPostsFromPeriods(periods);
    return {
      name,
      headline: member.headline || "",
      followers_total: Number(member.followers_total) || 0,
      periods,
      slug,
      photo: member.photo || `photos/${slug}.svg`,
      activity_posts: activityPosts,
      activity_coverage: normalizeActivityCoverage(member.activity_coverage, periods, activityPosts),
    };
  });
}

function normalizePeriod(period = {}) {
  const likes = num(period.likes);
  const comments = num(period.comments);
  const reposts = num(period.reposts);
  const posts = num(period.posts);
  const impressions = num(period.impressions);
  const engagements = num(period.engagements) || likes + comments + reposts;
  return {
    posts,
    impressions,
    likes,
    comments,
    reposts,
    engagements,
    eng_rate: num(period.eng_rate) || (impressions > 0 ? engagements / impressions : 0),
    avg: {
      impressions: num(period.avg?.impressions) || (posts > 0 ? impressions / posts : 0),
      likes: num(period.avg?.likes) || (posts > 0 ? likes / posts : 0),
      comments: num(period.avg?.comments) || (posts > 0 ? comments / posts : 0),
      reposts: num(period.avg?.reposts) || (posts > 0 ? reposts / posts : 0),
    },
    top_posts: Array.isArray(period.top_posts) ? period.top_posts.map(normalizePost) : [],
  };
}

function normalizePost(post = {}, index) {
  return {
    urn: post.urn || `post-${index}`,
    url: safeUrl(post.url),
    posted_at: post.posted_at || new Date().toISOString(),
    impressions: num(post.impressions),
    likes: num(post.likes),
    comments: num(post.comments),
    reposts: num(post.reposts),
    text: post.text || "",
  };
}

function normalizeActivityPost(post = {}, index = 0) {
  const postedAt = post.posted_at || post.date || "";
  if (!postedAt) return null;
  const sourceFlags = Array.isArray(post.source_flags)
    ? post.source_flags.map(String).filter(Boolean)
    : post.source
      ? [String(post.source)]
      : [];
  return {
    urn: post.urn || `activity-${index}`,
    url: safeUrl(post.url),
    posted_at: postedAt,
    impressions: num(post.impressions),
    likes: num(post.likes),
    comments: num(post.comments),
    reposts: num(post.reposts),
    text: post.text || "",
    source_flags: sourceFlags,
  };
}

function dedupeActivityPosts(posts) {
  const seen = new Set();
  const out = [];
  for (const post of posts) {
    const urlKey = post.url && post.url !== "#" && post.url !== "https://www.linkedin.com/" ? post.url : "";
    const key = urlKey || post.urn || `${post.posted_at}:${post.text.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(post);
  }
  return out.sort((a, b) => new Date(a.posted_at) - new Date(b.posted_at));
}

function activityPostsFromPeriods(periods = {}) {
  const posts = [];
  for (const period of Object.values(periods)) {
    for (const post of period.top_posts || []) {
      const normalized = normalizeActivityPost({ ...post, source_flags: ["top_posts"] }, posts.length);
      if (normalized) posts.push(normalized);
    }
  }
  return dedupeActivityPosts(posts);
}

function normalizeActivityCoverage(coverage = {}, periods = {}, activityPosts = []) {
  return {
    aggregate_posts: num(coverage.aggregate_posts) || num(periods.all?.posts) || activityPosts.length,
    dated_posts: num(coverage.dated_posts) || activityPosts.length,
  };
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return /^https?:$/.test(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function deriveTeamTotals(value) {
  for (const period of value.periods) {
    const agg = {
      posts: 0,
      impressions: 0,
      likes: 0,
      comments: 0,
      reposts: 0,
      engagements: 0,
      active_members: 0,
      followers_total: 0,
    };
    for (const member of value.members) {
      const p = member.periods[period] || normalizePeriod();
      agg.posts += p.posts;
      agg.impressions += p.impressions;
      agg.likes += p.likes;
      agg.comments += p.comments;
      agg.reposts += p.reposts;
      agg.engagements += p.engagements;
      agg.followers_total += member.followers_total || 0;
      if (p.posts > 0) agg.active_members += 1;
    }
    agg.eng_rate = agg.impressions > 0 ? agg.engagements / agg.impressions : 0;
    agg.avg_impressions_per_post = agg.posts > 0 ? agg.impressions / agg.posts : 0;
    value.team[period] = { ...agg, ...(value.team[period] || {}) };
  }
  value.total_followers = value.members.reduce((sum, member) => sum + (member.followers_total || 0), 0);
}

function deriveComparisonsAndTrend(value) {
  const now = new Date(value.generated_at).getTime();
  const teamPosts = [];
  for (const member of value.members) {
    const posts = datedPosts(member);
    member.compare = comparison(posts, now);
    teamPosts.push(...posts);
  }
  value.team.compare = comparison(teamPosts, now);
  value.team.timeseries = monthlyTrend(teamPosts, now);
  value.members.sort((a, b) => (b.periods["30d"]?.impressions || 0) - (a.periods["30d"]?.impressions || 0));
}

function datedPosts(member) {
  const seen = new Set();
  const out = [];
  const posts = Array.isArray(member.activity_posts) && member.activity_posts.length
    ? member.activity_posts
    : activityPostsFromPeriods(member.periods || {});
  for (const post of posts) {
    const urlKey = post.url && post.url !== "#" && post.url !== "https://www.linkedin.com/" ? post.url : "";
    const key = urlKey || post.urn || `${post.posted_at}:${String(post.text || "").slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      t: new Date(post.posted_at).getTime(),
      imp: post.impressions || 0,
      eng: (post.likes || 0) + (post.comments || 0) + (post.reposts || 0),
    });
  }
  return out.filter((post) => Number.isFinite(post.t));
}

function comparison(posts, now) {
  const result = {};
  for (const [period, days] of Object.entries(WINDOW_DAYS)) {
    const span = days * DAY;
    const cur = sums(posts, now - span, now + DAY);
    const prev = sums(posts, now - 2 * span, now - span);
    result[period] = {};
    for (const key of ["impressions", "engagements", "posts"]) {
      result[period][key] = { cur: cur[key], prev: prev[key], delta: rel(cur[key], prev[key]) };
    }
  }
  return result;
}

function monthlyTrend(posts, now) {
  const base = new Date(now);
  const out = [];
  for (let i = 7; i >= 0; i--) {
    const dt = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const start = dt.getTime();
    const end = new Date(dt.getFullYear(), dt.getMonth() + 1, 1).getTime();
    out.push({
      key: dt.toISOString().slice(0, 7),
      label: dt.toLocaleString("en", { month: "short" }),
      ...sums(posts, start, end),
    });
  }
  return out;
}

function sums(posts, from, to) {
  let impressions = 0;
  let engagements = 0;
  let count = 0;
  for (const post of posts) {
    if (post.t >= from && post.t < to) {
      impressions += post.imp;
      engagements += post.eng;
      count += 1;
    }
  }
  return { impressions, engagements, posts: count };
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

function slugFor(name) {
  return String(name || "member")
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]/g, "");
}

function num(value) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

function rel(cur, prev) {
  return prev > 0 ? (cur - prev) / prev : cur > 0 ? null : 0;
}
