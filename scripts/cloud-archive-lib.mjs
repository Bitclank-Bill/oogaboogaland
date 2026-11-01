// The Cloud Archive's history rules, as pure functions (scripts/cloud-archive.mjs runs them on a real checkout; the
// suite's global tier checks them on made-up histories). What the archive may claim, and on what evidence:
//
// - Every book is a commit reachable from one explicit revision of the official `rock`, checked to be on it.
// - A commit is shown under its author as git recorded it (self-reported). It is linked to a GitHub account only when
//   its author address is a GitHub noreply address (`<id>+<login>@users.noreply.github.com`, or `<login>@…`), which
//   GitHub issues per account; such identities are keyed by that account. Any other author is "unlinked": kept as its
//   own identity per exact address (never shown), labelled by its git name, and never matched to an account by name.
// - A `[bot]` login (a GitHub App's reserved suffix) is automation. AI agents and organisations are only what the
//   reviewed mapping (scripts/cloud-archive-identities.json) names, by login or by the SHA-256 of an exact address.
// - A merged pull request is counted only when a merge commit's second parent is the head GitHub publishes for it
//   (`refs/pull/<n>/head`). Subjects ("Merge pull request #n from owner/branch", "… (#n)") prove nothing, and neither a
//   branch's owner nor a merged commit's author is taken as the PR's author: PR authorship is not shown.
// - Days are UTC, by committer date. A shelf holds SHELF.capacity books; a busier day keeps capacity - 1 books and puts
//   the rest in one overflow binder, so every commit is still counted and none is silently dropped.
import { createHash } from "node:crypto";

export const OFFICIAL = { repo: "OogaBoogaX/oogaboogaland", url: "https://github.com/OogaBoogaX/oogaboogaland", branch: "rock" };
export const SHELF = { levels: 4, perLevel: 48, get capacity() { return this.levels * this.perLevel; } };
export const KINDS = ["account", "unlinked", "automation", "agent", "organisation"];
export const FLAG = { merge: 2 };
export const SEP = "\x1f", END = "\x1e";
export const LOG_FORMAT = `%H${SEP}%ct${SEP}%an${SEP}%ae${SEP}%P${SEP}%s${SEP}%b${END}`;
const NOREPLY = /^(?:(\d+)\+)?([A-Za-z0-9-]+(?:\[bot\])?)@users\.noreply\.github\.com$/i;
const SHA = /^[0-9a-f]{40}$/;

export const emailHash = (email) => createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

// `git log --format=LOG_FORMAT` output, newest first, as commits.
export const parseLog = (text) => {
  const out = [];
  for (const record of text.split(END)) {
    const t = record.replace(/^\n/, "");
    if (!t) continue;
    const [sha, time, name, email, parents, subject, body = ""] = t.split(SEP);
    out.push({ sha, time: Number(time), name, email, parents: parents.trim() ? parents.trim().split(" ") : [], subject, body });
  }
  return out;
};
// `git ls-remote <official> 'refs/pull/*/head'` output as Map(number → head sha).
export const parsePullHeads = (text) => {
  const heads = new Map();
  for (const line of text.split("\n")) {
    const m = /^([0-9a-f]{40})\trefs\/pull\/(\d+)\/head$/.exec(line.trim());
    if (m) heads.set(Number(m[2]), m[1]);
  }
  return heads;
};
// The revision must be a full SHA and on the official branch; null when it is, else why not. `isAncestor(a, b)` is
// git's (a is b or behind it). The checked-out HEAD plays no part.
export const checkRevision = ({ rev, officialTip, isAncestor }) => {
  if (!SHA.test(rev || "")) return "--rev must be a full 40-character commit SHA";
  if (!SHA.test(officialTip || "")) return "the official rock tip could not be read";
  if (!isAncestor(rev, officialTip)) return `${rev} is not on ${OFFICIAL.repo} ${OFFICIAL.branch} (tip ${officialTip})`;
  return null;
};
// Who a commit is, as far as the evidence goes: { key, label, kind }. The key never leaves the generator.
export const identityOf = (commit, identities = []) => {
  const m = NOREPLY.exec(commit.email.trim());
  const reviewed = identities.find((e) => m && e.login && e.login.toLowerCase() === m[2].toLowerCase()
    || e.emailSha256 && e.emailSha256 === emailHash(commit.email));
  if (m) {
    const login = m[2], key = m[1] ? `id:${m[1]}` : `login:${login.toLowerCase()}`;
    if (reviewed) return { key, label: reviewed.label || login, kind: reviewed.kind };
    return { key, label: login, kind: /\[bot\]$/i.test(login) ? "automation" : "account" };
  }
  const key = `email:${emailHash(commit.email)}`;
  if (reviewed) return { key, label: reviewed.label, kind: reviewed.kind };
  return { key, label: commit.name.trim() || "unknown", kind: "unlinked" };
};
// Published heads by commit: the lowest PR number for a head two PRs share.
export const pullsByHead = (pullHeads) => {
  const out = new Map();
  for (const [number, head] of pullHeads) if (!out.has(head) || out.get(head) > number) out.set(head, number);
  return out;
};
// A merge commit's PR, only when its second parent is that PR's published head.
export const verifiedPull = (commit, byHead) => commit.parents.length > 1 && byHead.get(commit.parents[1]) || 0;
export const shelve = (count, capacity = SHELF.capacity) => count <= capacity ? { books: count, overflow: 0 } : { books: capacity - 1, overflow: count - (capacity - 1) };
// No address reaches the page: anything shaped like one in a title is replaced. A PR's title is the merge message's
// first line that is not a trailer (`Co-Authored-By: …`), else the subject.
const ADDRESS = /<?[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}>?/g, TRAILER = /^[A-Za-z][A-Za-z-]*: /;
export const scrub = (text) => text.replace(ADDRESS, "[address removed]");
const pullTitle = (c) => c.body.split("\n").map((l) => l.trim()).find((l) => l && !TRAILER.test(l)) || c.subject;
export const utcDay = (seconds) => new Date(seconds * 1000).toISOString().slice(0, 10);

// The archive's data: people (label and kind only), days of [sha, person, title, pr, flags], honest counts and where
// it all came from.
export const buildArchive = ({ commits, pullHeads = new Map(), identities = [], rev, officialTip, repo = OFFICIAL.repo }) => {
  const ids = [], index = new Map();
  const person = (id) => {
    if (!index.has(id.key)) { index.set(id.key, ids.length); ids.push(id); }
    return index.get(id.key);
  };
  const byHead = pullsByHead(pullHeads), days = new Map(), pulls = new Set();
  for (const c of [...commits].sort((a, b) => a.time - b.time || (a.sha < b.sha ? -1 : 1))) {
    const pr = verifiedPull(c, byHead);
    if (pr) pulls.add(pr);
    const title = scrub(pr ? pullTitle(c) : c.subject);
    const day = utcDay(c.time);
    if (!days.has(day)) days.set(day, []);
    days.get(day).push([c.sha, person(identityOf(c, identities)), title.trim(), pr, c.parents.length > 1 ? FLAG.merge : 0]);
  }
  // Labels once every identity is known: an account or automation keeps its login (unique on GitHub); any other
  // identity whose label another also uses is numbered in order of appearance. Two identities are never merged.
  const uses = new Map(), nth = new Map();
  for (const id of ids) uses.set(id.label.toLowerCase(), (uses.get(id.label.toLowerCase()) || 0) + 1);
  const people = ids.map((id) => {
    const k = id.label.toLowerCase();
    if (id.kind === "account" || id.kind === "automation" || uses.get(k) < 2) return { label: id.label, kind: id.kind };
    nth.set(k, (nth.get(k) || 0) + 1);
    return { label: `${id.label} (${nth.get(k)})`, kind: id.kind };
  });
  const counts = { commits: commits.length, pulls: pulls.size };
  for (const kind of KINDS) counts[kind] = people.filter((p) => p.kind === kind).length;
  return {
    provenance: {
      repo, branch: OFFICIAL.branch, rev, officialTip,
      days: "UTC, by committer date",
      authors: "as recorded in git (self-reported); linked to a GitHub account only through a GitHub noreply address; others unlinked, one identity per exact address, never matched by name",
      pulls: "counted only when a merge commit's second parent is the PR's published head (refs/pull/<n>/head); PR authors are not shown",
      kinds: "automation: a [bot] noreply login; agent and organisation: the reviewed mapping only"
    },
    repo, rev, commits: commits.length, counts, shelf: { capacity: SHELF.capacity },
    people,
    days: [...days].map(([date, list]) => ({ date, commits: list }))
  };
};
