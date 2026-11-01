// The Cloud Archive's history rules, as pure functions (scripts/cloud-archive.mjs runs them on a real checkout; the
// suite's global tier checks them on made-up histories). What the archive may claim, and on what evidence:
//
// - Every book is a commit reachable from one explicit revision of the official `rock`, checked to be on it.
// - A commit is shown under its author identity as git recorded it: self-reported and historical, not verified current
//   account ownership. A numbered GitHub noreply address (`<id>+<login>@users.noreply.github.com`) is one identity
//   per account number, labelled by the newest login it was recorded under. The older unnumbered form (`<login>@…`)
//   joins a numbered identity only through a reviewed alias; while its login also appears numbered without one, it
//   stays a separate identity marked uncertain, whatever its kind. Any other author is "unlinked": its own identity
//   per exact address (never shown), labelled by the newest git name recorded with it, never matched by name.
//   Counts are of identities, never of unique people or bots.
// - A `[bot]` login (a GitHub App's reserved suffix) is automation. AI agents and organisations are only what the
//   reviewed mapping (scripts/cloud-archive-identities.json) names, by login or by the SHA-256 of an exact address.
// - Pull requests: a merge commit is a "PR-head match" for PR n when its second parent is the head GitHub publishes
//   for n (`refs/pull/<n>/head`). That shows the merge brought in PR n's head commit; it does not prove GitHub marked
//   n merged, so the archive says "PR-head match", never "merged PR". A head several PRs share credits none of them.
//   Subjects ("Merge pull request #n from owner/branch", "… (#n)") prove nothing, and neither a branch's owner nor a
//   merged commit's author is taken as a PR's author: PR authorship is not shown.
// - No address leaves: every exported label and title is scrubbed of anything shaped like one.
// - Days are UTC, by committer date. A shelf holds SHELF.capacity books; a busier day keeps capacity - 1 books and puts
//   the rest in one overflow binder, so every commit is still counted and none is silently dropped.
import { createHash } from "node:crypto";

export const OFFICIAL = { repo: "OogaBoogaX/oogaboogaland", url: "https://github.com/OogaBoogaX/oogaboogaland", branch: "rock" };
export const SHELF = { levels: 4, perLevel: 48, get capacity() { return this.levels * this.perLevel; } };
export const KINDS = ["account", "unlinked", "automation", "agent", "organisation"];
// flags: 2 a merge commit; 4 a merge whose second parent is a head several PRs share (credited to none).
export const FLAG = { merge: 2, sharedHead: 4 };
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
// Who a commit is, as far as the evidence goes: { key, label, kind, login, numbered }. The key never leaves the
// generator. A reviewed entry with `kind` sets a kind and label (by noreply login, either form, or by the SHA-256 of an
// exact address); one with `login` and `noreplyId` says the older, unnumbered noreply address of that login is that
// numbered identity. Nothing else joins two forms.
export const identityOf = (commit, identities = []) => {
  const m = NOREPLY.exec(commit.email.trim());
  const login = m ? m[2] : null, lower = login && login.toLowerCase();
  const reviewed = identities.find((e) => e.kind && (m && e.login && e.login.toLowerCase() === lower || e.emailSha256 && e.emailSha256 === emailHash(commit.email)));
  if (m) {
    const alias = !m[1] && identities.find((e) => e.noreplyId && e.login && e.login.toLowerCase() === lower);
    const id = m[1] || (alias ? String(alias.noreplyId) : null), key = id ? `id:${id}` : `unnumbered:${lower}`;
    return { key, label: reviewed && reviewed.label || login, reviewedLabel: !!(reviewed && reviewed.label), kind: reviewed ? reviewed.kind : /\[bot\]$/i.test(login) ? "automation" : "account", login, numbered: !!id };
  }
  const key = `email:${emailHash(commit.email)}`;
  if (reviewed) return { key, label: reviewed.label, reviewedLabel: true, kind: reviewed.kind, login: null, numbered: false };
  return { key, label: commit.name.trim() || "unknown", reviewedLabel: false, kind: "unlinked", login: null, numbered: false };
};
// Published heads by commit: every PR number whose head it is.
export const pullsByHead = (pullHeads) => {
  const out = new Map();
  for (const [number, head] of pullHeads) {
    if (!out.has(head)) out.set(head, []);
    out.get(head).push(number);
  }
  for (const list of out.values()) list.sort((a, b) => a - b);
  return out;
};
// The PR refs the matches were read from, as a deterministic digest: SHA-256 of "<n> <sha>\n" lines in PR order.
export const pullRefsDigest = (pullHeads) => createHash("sha256").update([...pullHeads].sort((a, b) => a[0] - b[0]).map(([n, sha]) => `${n} ${sha}\n`).join("")).digest("hex");
// A merge commit's PR-head match: { pr, shared }. pr is n only when the merge's second parent is the head of exactly
// one PR, n; a head several PRs share gives pr 0 and shared true.
export const pullMatch = (commit, byHead) => {
  const list = commit.parents.length > 1 ? byHead.get(commit.parents[1]) : null;
  if (!list) return { pr: 0, shared: false };
  return list.length === 1 ? { pr: list[0], shared: false } : { pr: 0, shared: true };
};
export const shelve = (count, capacity = SHELF.capacity) => count <= capacity ? { books: count, overflow: 0 } : { books: capacity - 1, overflow: count - (capacity - 1) };
// No address reaches the page. Rather than recognise addresses (Unicode names and domains, local hosts and bracketed
// IP literals all escape a narrow pattern), any run of non-space text with something on both sides of an "@" is
// replaced, in every title and label. An "@mention" (nothing before the "@") stays. A PR-head match's title is the
// merge message's first line that is not a trailer (`Co-Authored-By: …`), else the subject.
const ADDRESS = /\S*[^\s@]@[^\s@]\S*/gu, TRAILER = /^[A-Za-z][A-Za-z-]*: /;
export const scrub = (text) => text.replace(ADDRESS, "[address removed]");
const pullTitle = (c) => c.body.split("\n").map((l) => l.trim()).find((l) => l && !TRAILER.test(l)) || c.subject;
export const utcDay = (seconds) => new Date(seconds * 1000).toISOString().slice(0, 10);

// The archive's data: people (label, kind, and `uncertain` where it applies), days of [sha, person, title, pr, flags],
// counts of author identities (not of people or bots) and where it all came from. `pullRefs` says when and how the
// PR refs were read ({ fetchedAt, source }); the matches depend on that snapshot as much as on `rev`.
export const buildArchive = ({ commits, pullHeads = new Map(), pullRefs = {}, identities = [], rev, officialTip, repo = OFFICIAL.repo }) => {
  const ids = [], index = new Map();
  // Commits come oldest first, so an identity's label ends as the newest it was recorded under (a renamed login, a
  // changed git name); a reviewed label stays. Every login a numbered identity was seen under is kept for the check
  // below.
  const person = (id) => {
    if (!index.has(id.key)) { index.set(id.key, ids.length); ids.push({ ...id, logins: new Set() }); }
    const known = ids[index.get(id.key)];
    if (!id.reviewedLabel) known.label = id.label;
    if (id.login) known.logins.add(id.login.toLowerCase());
    return index.get(id.key);
  };
  const byHead = pullsByHead(pullHeads), days = new Map(), matched = new Set();
  let sharedHeads = 0, matchRows = 0;
  for (const c of [...commits].sort((a, b) => a.time - b.time || (a.sha < b.sha ? -1 : 1))) {
    const { pr, shared } = pullMatch(c, byHead);
    if (pr) { matched.add(pr); matchRows++; }
    if (shared) sharedHeads++;
    const title = scrub(pr ? pullTitle(c) : c.subject);
    const day = utcDay(c.time);
    if (!days.has(day)) days.set(day, []);
    days.get(day).push([c.sha, person(identityOf(c, identities)), title.trim(), pr, (c.parents.length > 1 ? FLAG.merge : 0) | (shared ? FLAG.sharedHead : 0)]);
  }
  // An unnumbered noreply login also seen on a numbered identity, with no reviewed alias, may be that identity or an
  // earlier holder of the login. Whatever its kind, it is kept apart, marked uncertain and labelled so; the counts
  // below are of identities and say how many are uncertain.
  const numbered = new Set();
  for (const id of ids) if (id.numbered) for (const l of id.logins) numbered.add(l);
  for (const id of ids) if (id.login && !id.numbered && numbered.has(id.login.toLowerCase())) {
    id.uncertain = true;
    id.label = `${id.reviewedLabel ? id.label : id.login} (unnumbered address, unconfirmed)`;
  }
  // Labels once every identity is known, scrubbed first. A label one identity alone uses stands as it is; so does an
  // account's or automation login's when no other account or automation uses it. Any other identity sharing a label is
  // numbered in order of appearance. Two identities are never merged, and no two exported labels are the same.
  const base = ids.map((id) => scrub(id.label)), uses = new Map(), loginUses = new Map(), nth = new Map();
  ids.forEach((id, i) => {
    const k = base[i].toLowerCase();
    uses.set(k, (uses.get(k) || 0) + 1);
    if (id.kind === "account" || id.kind === "automation") loginUses.set(k, (loginUses.get(k) || 0) + 1);
  });
  const taken = new Set();
  const people = ids.map((id, i) => {
    const k = base[i].toLowerCase(), plain = uses.get(k) < 2 || (id.kind === "account" || id.kind === "automation") && loginUses.get(k) === 1;
    let label = base[i];
    // Numbered when shared, and numbered on past any label already given (a git name may itself read "sam (1)").
    if (!plain || taken.has(label.toLowerCase())) do { nth.set(k, (nth.get(k) || 0) + 1); label = `${base[i]} (${nth.get(k)})`; } while (taken.has(label.toLowerCase()));
    taken.add(label.toLowerCase());
    return id.uncertain ? { label, kind: id.kind, uncertain: true } : { label, kind: id.kind };
  });
  const identityCounts = {};
  for (const kind of KINDS) identityCounts[kind] = people.filter((p) => p.kind === kind).length;
  const counts = { commits: commits.length, prHeadMatches: matched.size, prHeadMatchRows: matchRows, sharedHeadMerges: sharedHeads,
    identities: identityCounts, uncertainIdentities: people.filter((p) => p.uncertain).length };
  return {
    provenance: {
      repo, branch: OFFICIAL.branch, rev, officialTip,
      days: "UTC, by committer date",
      authors: "author identities as recorded in git (self-reported historical identities, not verified current account ownership): a numbered GitHub noreply address is one identity per account number, labelled by the newest login it was recorded under; an unnumbered noreply address joins one only by reviewed alias, and while its login also appears numbered it stays a separate identity marked uncertain, whatever its kind; any other address is an unlinked identity, labelled by the newest git name recorded with it and never matched to an account by name. Counts are of identities, not of people or bots. Every label and title is scrubbed of anything address-shaped",
      pulls: "PR-head matches: a merge commit whose second parent is the head GitHub publishes for exactly one PR (refs/pull/<n>/head). This shows the merge brought in that PR's head, not that GitHub marked the PR merged; a head several PRs share credits none; PR authors are not shown. Matches depend on the PR ref snapshot below as well as on rev. prHeadMatches counts distinct PR numbers; prHeadMatchRows counts merge commits with a match (one PR head can be merged more than once)",
      pullRefs: { fetchedAt: pullRefs.fetchedAt || null, source: pullRefs.source || null, count: pullHeads.size, digest: pullRefsDigest(pullHeads) },
      kinds: "automation: a [bot] noreply login; agent and organisation: the reviewed mapping only"
    },
    repo, rev, commits: commits.length, counts, shelf: { capacity: SHELF.capacity },
    people,
    days: [...days].map(([date, list]) => ({ date, commits: list }))
  };
};
