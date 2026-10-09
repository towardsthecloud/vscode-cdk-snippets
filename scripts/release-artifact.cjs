const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const stableVersion = /^\d+\.\d+\.\d+$/;
const assets = ['cdk-snippets.vsix', 'cdk-snippets.vsix.sha256'];
const command = (executable, args) => execFileSync(executable, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const releases = () => JSON.parse(command('gh', ['release', 'list', '--limit', '1000', '--json', 'tagName,isDraft']));
const recordedRun = tag => command('git', ['show', '-s', '--format=%B', `refs/tags/${tag}`]).match(/^Release-Run: (\d+)$/m)?.[1];

function verifyChecksum(directory) {
  const expected = fs.readFileSync(path.join(directory, assets[1]), 'utf8').match(/^([a-f0-9]{64})\s+\*?(?:artifacts\/)?cdk-snippets\.vsix\s*$/)?.[1];
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, assets[0]))).digest('hex');
  assert.equal(actual, expected, 'Release package checksum does not match');
}

function pending() {
  const available = releases();
  const tags = command('git', ['tag', '--list', '--sort=-version:refname']).split('\n');
  const managedTag = tag => tags.includes(tag) && recordedRun(tag);
  let tag = process.env.REQUESTED_TAG || available.find(release => release.isDraft && stableVersion.test(release.tagName) && managedTag(release.tagName))?.tagName;
  if (!tag) {
    const latest = tags.find(value => stableVersion.test(value));
    // The commit marker distinguishes a failed new release from legacy tags.
    if (latest && !available.some(release => release.tagName === latest) && managedTag(latest)) tag = latest;
  }
  if (tag) assert.match(tag, stableVersion, 'Expected a stable release tag');
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `tag=${tag || ''}\n`);
  console.log(tag || '');
}

function recover(tag) {
  assert.match(tag || '', stableVersion, 'Expected a stable release tag');
  const exists = releases().some(release => release.tagName === tag);
  const release = exists ? JSON.parse(command('gh', ['release', 'view', tag, '--json', 'isDraft,assets'])) : undefined;
  const existingAssets = assets.filter(name => release?.assets.some(asset => asset.name === name && asset.state === 'uploaded'));
  const failedAssets = assets.filter(name => release?.assets.some(asset => asset.name === name && asset.state === 'starter'));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cdk-release-artifact-'));
  try {
    const current = path.join(directory, 'current');
    const saved = path.join(directory, 'saved');
    fs.mkdirSync(current);
    fs.mkdirSync(saved);
    if (existingAssets.length) command('gh', ['release', 'download', tag, '--dir', current, ...existingAssets.flatMap(name => ['--pattern', name])]);
    if (existingAssets.length === assets.length) {
      verifyChecksum(current);
      return;
    }
    assert.ok(!release || release.isDraft, 'Cannot repair an incomplete public release');
    const run = recordedRun(tag);
    assert.ok(run, `Tag ${tag} has no retained package run; automatic recovery is unavailable`);
    command('gh', ['run', 'download', run, '--name', `release-${tag}`, '--dir', saved]);
    assert.equal(JSON.parse(fs.readFileSync(path.join(saved, 'release.json'), 'utf8')).version, tag, 'Retained package belongs to a different version');
    verifyChecksum(saved);
    for (const name of existingAssets) {
      assert.deepEqual(fs.readFileSync(path.join(current, name)), fs.readFileSync(path.join(saved, name)), 'Existing release asset differs from the retained package');
    }
    // GitHub can leave an empty starter asset after a 502. Only those failed
    // draft uploads are deleted, after verifying the retained replacement.
    for (const name of failedAssets) command('gh', ['release', 'delete-asset', tag, name, '--yes']);
    if (!release) command('gh', ['release', 'create', tag, '--draft', '--verify-tag', '--title', tag, '--notes-file', path.join(saved, 'release-notes.md')]);
    command('gh', ['release', 'upload', tag, ...assets.filter(name => !existingAssets.includes(name)).map(name => path.join(saved, name))]);
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
}

try {
  if (process.argv[2] === 'pending') pending();
  else if (process.argv[2] === 'recover') recover(process.argv[3]);
  else throw new Error('Usage: release-artifact.cjs pending | recover <tag>');
} catch (error) {
  console.error(error.stderr?.toString() || error.message);
  process.exitCode = 1;
}
