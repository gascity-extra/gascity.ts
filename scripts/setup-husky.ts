#!/usr/bin/env bun
/**
 * Setup script for Husky git hooks
 * This script can be run manually to set up or reconfigure Husky hooks
 */

import { $, fs } from "bun";

const PRE_COMMIT_HOOK = `bunx biome check --write --staged`;

const COMMIT_MSG_HOOK = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Conventional commits pattern: type(scope): description
# Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
PATTERN="^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,}"

if ! grep -qE "$PATTERN" "$1"; then
  echo "❌ Invalid commit message format."
  echo "📝 Conventional commits format required:"
  echo "   type(scope): description"
  echo ""
  echo "   Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert"
  echo "   Example: feat(auth): add login functionality"
  echo "   Example: fix: resolve memory leak"
  exit 1
fi
`;

async function setupHusky() {
  console.log("🔧 Setting up Husky git hooks...");

  // Ensure .husky directory exists
  const huskyDir = ".husky";
  if (!await fs.exists(huskyDir)) {
    await $`mkdir -p ${huskyDir}`;
    console.log(`✅ Created ${huskyDir} directory`);
  }

  // Write pre-commit hook
  const preCommitPath = ".husky/pre-commit";
  await fs.writeFile(preCommitPath, PRE_COMMIT_HOOK);
  await $`chmod +x ${preCommitPath}`;
  console.log(`✅ Configured pre-commit hook`);

  // Write commit-msg hook
  const commitMsgPath = ".husky/commit-msg";
  await fs.writeFile(commitMsgPath, COMMIT_MSG_HOOK);
  await $`chmod +x ${commitMsgPath}`;
  console.log(`✅ Configured commit-msg hook`);

  // Initialize Husky if not already done
  try {
    await $`bunx husky install`;
    console.log(`✅ Husky installed`);
  } catch (error) {
    console.log(`⚠️  Husky install failed (may already be initialized)`);
  }

  console.log("\n✨ Husky hooks setup complete!");
  console.log("\n📋 Configured hooks:");
  console.log("   • pre-commit: Runs biome check --write --staged");
  console.log("   • commit-msg: Validates conventional commits format");
  console.log("\n💡 Hooks will run automatically on git operations.");
}

setupHusky().catch((error) => {
  console.error("❌ Failed to setup Husky:", error);
  process.exit(1);
});
