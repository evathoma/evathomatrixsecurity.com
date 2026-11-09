const path = require('path');
const { spawnSync } = require('child_process');

// Tailwind 3 bundles its own Browserslist snapshot, so the updater cannot refresh its old-data notice.
const tailwindCli = require.resolve('tailwindcss/lib/cli.js');
const result = spawnSync(
  process.execPath,
  [
    tailwindCli,
    '-i',
    './src/styles/tailwind.css',
    '-o',
    './public/css/tailwind.css',
    ...process.argv.slice(2),
  ],
  {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, BROWSERSLIST_IGNORE_OLD_DATA: '1' },
    stdio: 'inherit',
  }
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
