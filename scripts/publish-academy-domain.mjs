import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const owner = "BryanRalston";
const repo = "squishee-academy";
const branch = "gh-pages";
const domain = "squisheeacademy.com";
const token = process.env.ACADEMY_DEPLOY_TOKEN ?? "";

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function clicks() {
  return [
    "Bryan still needs to click these before https://squisheeacademy.com can serve Academy:",
    "1. Create an empty public repo: https://github.com/new",
    "   Owner BryanRalston, name squishee-academy, Public, no README, no .gitignore, no license.",
    "2. Create a fine-grained token: https://github.com/settings/personal-access-tokens/new",
    "   Resource owner BryanRalston. Only repository squishee-academy.",
    "   Permissions: Contents Read and write, Pages Read and write.",
    "3. Add the token on times-tables: https://github.com/BryanRalston/times-tables/settings/secrets/actions/new",
    "   Name ACADEMY_DEPLOY_TOKEN.",
    "4. Re-run this workflow (Actions → Deploy Squishee Academy domain → Run workflow).",
    "5. If Pages did not turn on, open https://github.com/BryanRalston/squishee-academy/settings/pages",
    "   Source: Deploy from a branch. Branch: gh-pages, folder / (root). Save.",
    "   Custom domain: squisheeacademy.com. Save. Then check Enforce HTTPS.",
  ].join("\n");
}

if (!token) fail(`ACADEMY_DEPLOY_TOKEN is not set.\n${clicks()}`);

const source = "dist-domain";
const work = mkdtempSync(join(tmpdir(), "academy-pages-"));
const remote = `https://github.com/${owner}/${repo}.git`;

function git(args, cwd = work) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Cursor Agent",
      GIT_AUTHOR_EMAIL: "cursoragent@cursor.com",
      GIT_COMMITTER_NAME: "Cursor Agent",
      GIT_COMMITTER_EMAIL: "cursoragent@cursor.com",
      GIT_TERMINAL_PROMPT: "0",
    },
  });
  if (result.status !== 0) {
    const detail = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.replaceAll(token, "***");
    fail(`git ${args[0]} failed\n${detail}\n${clicks()}`);
  }
  return result.stdout ?? "";
}

const copied = spawnSync("cp", ["-a", `${source}/.`, work], { encoding: "utf8" });
if (copied.status !== 0) fail(`copy dist-domain failed\n${copied.stderr ?? ""}`);
git(["init", "-b", branch]);
git(["config", "user.name", "Cursor Agent"]);
git(["config", "user.email", "cursoragent@cursor.com"]);
git(["add", "-A"]);
git(["commit", "-m", "Publish Squishee Academy"]);
git(["-c", `http.extraheader=AUTHORIZATION: bearer ${token}`, "push", "--force", remote, `HEAD:${branch}`]);
console.log(`pushed ${owner}/${repo} ${branch}`);

async function api(method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "squishee-academy-deploy",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text.slice(0, 300) };
    }
  }
  return { status: res.status, data };
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

const pagesPath = `/repos/${owner}/${repo}/pages`;

try {
  const existing = await api("GET", pagesPath);
  if (existing.status === 404) {
    const created = await api("POST", pagesPath, {
      build_type: "legacy",
      source: { branch, path: "/" },
    });
    console.log(`create pages ${created.status} ${created.data.message ?? ""}`);
    if (created.status >= 400 && created.status !== 409) {
      fail(`Could not enable GitHub Pages (${created.status}).\n${clicks()}`);
    }
  } else if (existing.status >= 400) {
    fail(`Could not read GitHub Pages (${existing.status} ${existing.data.message ?? ""}).\n${clicks()}`);
  } else {
    console.log(`pages status ${existing.data.status ?? "ok"} https_enforced=${existing.data.https_enforced}`);
  }

  const named = await api("PUT", pagesPath, {
    cname: domain,
    source: { branch, path: "/" },
    build_type: "legacy",
  });
  console.log(`set cname ${named.status} ${named.data.message ?? named.data.cname ?? ""}`);
  if (named.status >= 400) {
    fail(`Could not set the custom domain (${named.status}).\n${clicks()}`);
  }

  let https = false;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const enforced = await api("PUT", pagesPath, {
      cname: domain,
      https_enforced: true,
      build_type: "legacy",
      source: { branch, path: "/" },
    });
    const message = typeof enforced.data.message === "string" ? enforced.data.message : "";
    console.log(`enforce https attempt ${attempt} ${enforced.status} ${message}`);
    if (enforced.status < 300 && enforced.data.https_enforced === true) {
      https = true;
      break;
    }
    const current = await api("GET", pagesPath);
    if (current.data.https_enforced === true) {
      https = true;
      break;
    }
    await sleep(20_000);
  }

  if (!https) {
    console.log("HTTPS certificate is not enforced yet. GitHub is still issuing it, or Pages custom domain is not saved.");
    console.log("Check https://github.com/BryanRalston/squishee-academy/settings/pages and turn on Enforce HTTPS when the certificate is ready.");
  } else {
    console.log("HTTPS enforced");
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
