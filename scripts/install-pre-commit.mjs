import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function resolveGitDirectory() {
  return path.join(process.cwd(), '.git');
}

function resolveHooksDirectory(gitDirectory) {
  return path.join(gitDirectory, 'hooks');
}

function buildHookScript() {
  return '#!/bin/sh\nnpm run precommit\n';
}

function installPreCommitHook(hooksDirectory) {
  const hookPath = path.join(hooksDirectory, 'pre-commit');
  writeFileSync(hookPath, buildHookScript());
  chmodSync(hookPath, 0o755);
}

function ensureHooksDirectory(hooksDirectory) {
  mkdirSync(hooksDirectory, { recursive: true });
}

function main() {
  const gitDirectory = resolveGitDirectory();
  if (!existsSync(gitDirectory)) {
    console.log('Skipping pre-commit install: .git directory not found.');
    return;
  }

  const hooksDirectory = resolveHooksDirectory(gitDirectory);
  ensureHooksDirectory(hooksDirectory);
  installPreCommitHook(hooksDirectory);
  console.log('Installed .git/hooks/pre-commit.');
}

main();
