const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.error || result.status > 1 || result.status === null) {
    throw result.error || new Error(result.stderr);
  }
  return result;
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const tags = git(['tag', '--list', '--sort=-version:refname']).stdout.trim().split('\n');
const latest = tags.find(tag => /^\d+\.\d+\.\d+$/.test(tag));
const inputs = ['package.json', '.vscodeignore', 'README.md', 'images/cdk-snippets-extension-icon.png', 'snippets'];
const changed = !latest || git(['diff', '--quiet', latest, '--', ...inputs]).status === 1;
fs.mkdirSync('artifacts', { recursive: true });
if (!changed) {
  fs.writeFileSync('artifacts/release.json', JSON.stringify({ changed: false }));
  console.log('Published content is unchanged; skipping release');
} else {
  if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error('Expected a stable extension version');
  const [major, minor, patch] = pkg.version.split('.').map(Number);
  const version = `${major}.${minor}.${patch + 1}`;
  if (tags.includes(version)) throw new Error(`Release tag ${version} already exists`);
  pkg.version = version;
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  lock.version = version;
  lock.packages[''].version = version;
  const cdkVersion = pkg.devDependencies['aws-cdk-lib'];
  const date = new Date().toISOString().slice(0, 10);
  const notes = `Snippets target AWS CDK ${cdkVersion} in TypeScript and Python. Existing prefixes insert required properties; append \`-full\` for bounded optional-property examples. Placeholder values must be edited for your resource.\n`;
  const heading = `${version} (${date})`;
  const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
  const marker = 'Changelog\n=========\n';
  if (!changelog.startsWith(marker)) throw new Error('Unrecognized changelog heading');
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
  fs.writeFileSync('CHANGELOG.md', marker + `\n\n${heading}\n${'-'.repeat(heading.length)}\n- ${notes}\n` + changelog.slice(marker.length).trimStart());
  fs.writeFileSync(path.join('artifacts', 'release-notes.md'), notes);
  fs.writeFileSync(path.join('artifacts', 'release.json'), JSON.stringify({ changed: true, version }));
  console.log(`Prepared extension ${version} for CDK ${cdkVersion}`);
}
