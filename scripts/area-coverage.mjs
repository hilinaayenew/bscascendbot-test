// ============================================================================
// Area coverage score
//
// Reads what's already on disk — area configs, the drafted-answer pool, and
// the last `coach:scenarios` sweep for each area — and turns it into a single
// number per area. It does not run anything against Azure; run
// `npm run coach:scenarios -- --area=<area>` first if you want fresh numbers.
//
// Deliberately narrow. Several things a coverage score "should" include
// aren't computed anywhere in this repo yet — dead-end counts beyond what's
// read off a closing question by eye, cross-area transition tests, web-search
// grounding checks, adversarial-user testing. Rather than invent a number for
// those, this reports them as NOT TRACKED and leaves them out of the score.
// A score built by guessing at what it can't measure is worse than no score.
// ============================================================================

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FN = join(ROOT, "supabase", "functions", "ai-career-coach");

// slug -> the exact "Inside <Area>" heading text in storyboard.html, used to
// slice out that area's own section so the dead-end-sweep flag isn't read
// from the wrong area by accident.
const AREAS = [
  { slug: "salary", heading: "Inside Salary &amp; Negotiation" },
  { slug: "getting-started", heading: "Inside Getting Started" },
  { slug: "further-education", heading: "Inside Further Education" },
  { slug: "career-paths", heading: "Inside Career Paths &amp; Roadmaps" },
  { slug: "mentorship", heading: "Inside Mentorship" },
  { slug: "confidence", heading: "Inside Confidence &amp; Imposter Syndrome" },
];

const areaArg = process.argv.find((a) => a.startsWith("--area="));
const targets = areaArg ? areaArg.slice(7).split(",").map((s) => s.trim().toLowerCase()) : AREAS.map((a) => a.slug);

let storyboard = "";
try {
  storyboard = readFileSync(join(ROOT, "storyboard.html"), "utf8");
} catch {
  console.error("storyboard.html not found at repo root — dead-end-sweep status will read as NOT FOUND for every area.");
}

function storyboardSection(heading) {
  if (!storyboard) return null;
  const start = storyboard.indexOf(heading);
  if (start === -1) return null;
  const rest = storyboard.slice(start + heading.length);
  const nextHeadingOffset = rest.search(/<h2 class="section-heading">Inside |<div id="tab-plan"/);
  return nextHeadingOffset === -1 ? rest : rest.slice(0, nextHeadingOffset);
}

// Same extraction shape as scripts/coach-local.mjs's loadDrafted(), extended
// to also pull respondsTo and reviewStatus. botema-generated-examples.ts
// checks out CRLF on this machine — \r?\n throughout, not a bare \n, or this
// silently returns nothing for every area (the bug documented in
// coach-local.mjs's own loadDrafted comment).
function loadDrafted(areaN) {
  const src = readFileSync(join(FN, "botema-generated-examples.ts"), "utf8");
  const body = src.slice(src.indexOf("adviseOnCareerTopic: ["));
  const out = [];
  for (const chunk of body.split(/\r?\n    \{\r?\n/).slice(1)) {
    const e = chunk.split(/\r?\n    \},/)[0];
    const facet = e.match(/facet:\s*"([A-Za-z0-9]+)"/);
    const ar = e.match(/area:\s*(\d+)/);
    if (!facet || !ar || Number(ar[1]) !== areaN) continue;
    const respondsTo = e.match(/respondsTo:\s*"([A-Za-z0-9]+)"/);
    const status = e.match(/reviewStatus:\s*"(\w+)"/);
    out.push({ facet: facet[1], respondsTo: respondsTo?.[1] ?? null, status: status?.[1] ?? "unknown" });
  }
  return out;
}

function readmeSummary(slug) {
  let text;
  try {
    text = readFileSync(join(ROOT, "examples", slug, "README.md"), "utf8");
  } catch {
    return null;
  }
  const passLine = text.match(/\*\*(\d+) of (\d+) scenarios passed all checks\.\*\*/);
  const runLine = text.match(/last run \*\*([^*]+)\*\*/);
  return {
    passed: passLine ? Number(passLine[1]) : null,
    total: passLine ? Number(passLine[2]) : null,
    lastRun: runLine ? runLine[1] : null,
  };
}

// Per-line checks under each scenario's own "## Checks" section — finer
// grain than the README's "N of 5 scenarios passed", since a scenario with
// one failed check among eight still counts as a whole-scenario fail there.
function checkTally(slug) {
  const dir = join(ROOT, "examples", slug);
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md");
  } catch {
    return null;
  }
  let pass = 0, fail = 0, error = 0;
  const failed = [];
  for (const f of files) {
    const text = readFileSync(join(dir, f), "utf8");
    const section = text.split(/^## Checks/m)[1];
    if (!section) continue;
    const body = section.split(/^---/m)[0];
    for (const line of body.split(/\r?\n/)) {
      const t = line.trim();
      if (!t.startsWith("-")) continue;
      if (/\*\*FAIL\*\*/.test(t)) { fail++; failed.push(`${f} — ${t.replace(/^-+\s*/, "")}`); }
      else if (/\*\*ERROR\*\*/.test(t)) { error++; failed.push(`${f} — ${t.replace(/^-+\s*/, "")}`); }
      else if (/PASS/.test(t)) { pass++; }
    }
  }
  return { pass, fail, error, total: pass + fail + error, failed };
}

function pct(n, d) {
  return d > 0 ? Math.round((n / d) * 100) : null;
}

async function main() {
  const rows = [];
  for (const slug of targets) {
    const def = AREAS.find((a) => a.slug === slug);
    if (!def) {
      console.error(`Unknown area: ${slug} (known: ${AREAS.map((a) => a.slug).join(", ")})`);
      continue;
    }
    const area = (await import(`./areas/${slug}.mjs`)).default;

    const stageFacets = new Set(Object.values(area.stages).flatMap((s) => s.facets));
    const missingCore = area.realOrder.filter((f) => !stageFacets.has(f));

    const drafted = loadDrafted(area.n);
    const branches = drafted.filter((d) => d.respondsTo);
    const ownFacets = drafted.filter((d) => !d.respondsTo);
    const approvedOrEdited = drafted.filter((d) => d.status === "approved" || d.status === "edited");

    const sweep = readmeSummary(slug);
    const checks = checkTally(slug);

    // Matches only the NEGATIVE disclaimer ("not yet confirmed/run ... dead-end
    // sweep") — the bare phrase "full dead-end sweep" also appears in the
    // POSITIVE wording once an area's sweep is done ("confirmed by a full
    // dead-end sweep run <date>"), so testing for the phrase alone flagged
    // every completed sweep as still outstanding. Found live 2026-08-27 when
    // this script's own output didn't reflect storyboard edits just made.
    const section = storyboardSection(def.heading);
    const deadEndFlagged = section === null ? null : /not yet (confirmed|run)[^.]{0,40}dead-end sweep/i.test(section);

    const checkPct = checks && checks.total > 0 ? pct(checks.pass, checks.total) : null;
    const corePct = pct(area.realOrder.length - missingCore.length, area.realOrder.length);
    const scoreParts = [corePct, checkPct].filter((v) => v !== null);
    const score = scoreParts.length ? Math.round(scoreParts.reduce((a, b) => a + b, 0) / scoreParts.length) : null;

    rows.push({
      slug, name: area.name, n: area.n,
      coreWired: area.realOrder.length - missingCore.length, coreTotal: area.realOrder.length, missingCore,
      ownFacets: ownFacets.length, branches: branches.length, draftedTotal: drafted.length,
      approvedOrEdited: approvedOrEdited.length,
      sweep, checks, deadEndFlagged, score,
    });
  }

  console.log("\nArea coverage — derived from files on disk, not re-run against Azure\n");

  for (const r of rows) {
    console.log(`## ${r.name} (${r.slug})`);
    console.log(`Core answers wired:        ${r.coreWired}/${r.coreTotal}${r.missingCore.length ? `  (missing: ${r.missingCore.join(", ")})` : ""}`);
    console.log(`Drafted facets:            ${r.ownFacets} new + ${r.branches} response branches = ${r.draftedTotal}`);
    console.log(`Approved or edited:        ${r.approvedOrEdited}/${r.draftedTotal}${r.draftedTotal && r.approvedOrEdited === 0 ? "  (none reviewed yet — expected, review is Otema's)" : ""}`);
    if (r.checks && r.checks.total > 0) {
      console.log(`Scenario checks:           ${r.checks.pass}/${r.checks.total} individual checks passed (${r.checks.fail} fail, ${r.checks.error} error)`);
      if (r.checks.failed.length) for (const f of r.checks.failed) console.log(`  - ${f}`);
    } else {
      console.log(`Scenario checks:           NOT FOUND — run \`npm run coach:scenarios -- --area=${r.slug}\` first`);
    }
    if (r.sweep) console.log(`Last sweep:                ${r.sweep.passed ?? "?"}/${r.sweep.total ?? "?"} scenarios, ${r.sweep.lastRun ?? "date unknown"}`);
    console.log(`Full dead-end sweep:       ${r.deadEndFlagged === null ? "NOT TRACKED — storyboard section not found" : r.deadEndFlagged ? "storyboard says NOT yet run" : "no \"not yet run\" disclaimer found in storyboard (not the same as confirmed run)"}`);
    console.log(`Cross-area transitions:    NOT TRACKED`);
    console.log(`Adversarial-user testing:  NOT TRACKED`);
    console.log(`Web-search grounding:      NOT TRACKED`);
    console.log(`Score (core + checks only): ${r.score === null ? "n/a" : r.score + "%"}`);
    console.log("");
  }

  if (rows.length > 1) {
    console.log("## Summary\n");
    const width = Math.max(...rows.map((r) => r.name.length));
    for (const r of rows.slice().sort((a, b) => (b.score ?? -1) - (a.score ?? -1))) {
      console.log(`${r.name.padEnd(width)}  ${r.score === null ? "n/a" : r.score + "%"}`);
    }
    console.log(
      "\nScore = average of (core Otema answers wired into the coverage map) and (individual scenario checks passing).\n" +
      "Deliberately excludes review-approval rate, dead-end sweep completeness, cross-area transitions,\n" +
      "adversarial testing and web-search grounding — none of those are actually measured anywhere in this\n" +
      "repo yet, and folding in an unmeasured 0 would just be a different way of inventing a number.",
    );
  }
}

main();
