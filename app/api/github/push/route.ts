import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cwd = process.cwd();
    const token = process.env.GITHUB_TOKEN || "";
    const repo = "lazyv0rtex/personal-knowledge-agent";

    if (!token) {
      return NextResponse.json({ error: "GITHUB_TOKEN not set in environment" }, { status: 400 });
    }

    execSync("git add .", { cwd });
    
    let hasChanges = true;
    try {
      execSync('git diff --cached --exit-code', { cwd });
      hasChanges = false;
    } catch {
      hasChanges = true;
    }

    if (!hasChanges) {
      return NextResponse.json({ message: "Nothing to push — no changes detected." });
    }

    const date = new Date().toISOString().replace("T", " ").slice(0, 16);
    execSync(`git commit -m "Update notes: ${date}"`, { cwd });
    execSync(
      `git push https://${token}@github.com/${repo}.git main`,
      { cwd }
    );

    return NextResponse.json({ message: `✓ Pushed to github.com/${repo}` });
  } catch (err: any) {
    const message = err?.stderr?.toString() || err?.message || "Push failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
