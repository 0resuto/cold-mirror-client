/**
 * Build wrapper for electron-builder.
 *
 * Runs pre-flight checks and catches common build errors,
 * printing short, actionable messages instead of raw traces.
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function fail(message) {
  console.error(`\n${BOLD}${RED}Build failed: ${message}${RESET}\n`);
  process.exit(1);
}

function isSymlinkError(output) {
  return (
    output.includes('Cannot create symbolic link') ||
    output.includes('A required privilege is not held by the client')
  );
}

function isModuleMismatch(output) {
  return (
    output.includes('NODE_MODULE_VERSION') ||
    output.includes('was compiled against a different Node.js version')
  );
}

// ── Pre-flight checks ───────────────────────────────────────────────

if (!existsSync('node_modules')) {
  fail('node_modules not found. Run "npm install" first.');
}

if (!existsSync('public/app_icon.ico')) {
  fail('application icon missing at public/app_icon.ico.');
}

// ── Disable code signing ────────────────────────────────────────────
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';

// ── Build ───────────────────────────────────────────────────────────

try {
  console.log(`${CYAN}> Building renderer (vite build)...${RESET}\n`);
  execSync('vite build', { stdio: 'inherit' });

  console.log(`\n${CYAN}> Packaging application (electron-builder)...${RESET}\n`);
  execSync('electron-builder', { stdio: 'inherit' });

  console.log(`\n${BOLD}${CYAN}Build completed successfully.${RESET}\n`);
} catch (error) {
  const combined = [error.stdout, error.stderr, error.message]
    .filter(Boolean)
    .join('\n');

  if (isSymlinkError(combined)) {
    fail('unable to create symbolic links.\nPlease re-run the build in an Administrator terminal.');
  }

  if (isModuleMismatch(combined)) {
    fail(
      'native module version mismatch.\n' +
        'Run "npx electron-rebuild" and try again.',
    );
  }

  // Unknown error — print captured output as-is.
  console.error(`\n${RED}${BOLD}Build failed:${RESET}\n`);
  if (error.stdout) process.stdout.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  if (!error.stdout && !error.stderr) console.error(error.message);
  process.exit(error.status ?? 1);
}
