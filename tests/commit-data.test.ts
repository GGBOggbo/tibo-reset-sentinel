import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { it, expect } from "vitest";

it("脏数据先提交再 rebase，保留远端其他提交并成功推送；重复运行不制造提交", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sentinel-git-test-"));
  const repo = path.join(root, "job");
  const origin = path.join(root, "origin.git");
  const other = path.join(root, "other");
  const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  try {
    git(root, "init", "--bare", "--initial-branch=main", origin);
    git(root, "clone", origin, repo);
    git(repo, "config", "user.name", "test"); git(repo, "config", "user.email", "test@example.invalid");
    fs.mkdirSync(path.join(repo, "data"));
    fs.writeFileSync(path.join(repo, "data/events.json"), "[]\n");
    fs.writeFileSync(path.join(repo, "data/health.json"), "{}\n");
    git(repo, "add", "."); git(repo, "commit", "-m", "base"); git(repo, "push", "origin", "main");
    git(root, "clone", origin, other);
    fs.writeFileSync(path.join(other, "README.md"), "remote edit\n");
    git(other, "add", "."); git(other, "-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-m", "remote edit");
    git(other, "push", "origin", "main");
    fs.writeFileSync(path.join(repo, "data/events.json"), "[1]\n");
    // 原来的顺序在相同场景必然报错；修复脚本必须能保存数据并完成 rebase。
    expect(() => git(repo, "pull", "--rebase")).toThrow(/unstaged changes/);
    git(repo, "config", "--unset", "user.name"); git(repo, "config", "--unset", "user.email");
    const script = path.resolve("scripts/commit-data.sh");
    execFileSync("bash", [script], { cwd: repo, stdio: "pipe" });
    expect(git(origin, "show", "main:data/events.json")).toBe("[1]");
    expect(git(repo, "show", "HEAD:README.md")).toBe("remote edit");
    const head = git(origin, "rev-parse", "main");
    execFileSync("bash", [script], { cwd: repo, stdio: "pipe" });
    expect(git(origin, "rev-parse", "main")).toBe(head);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
