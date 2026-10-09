const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const script = path.resolve(__dirname, '../scripts/release-artifact.cjs');

test('a tagged release recovers its saved bytes after draft creation or partial upload, without a new version', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cdk-release-recovery-'));
  t.after(() => fs.rmSync(directory, { recursive: true }));
  const bin = path.join(directory, 'bin');
  const saved = path.join(directory, 'saved');
  const remote = path.join(directory, 'remote');
  for (const folder of [bin, saved, remote]) fs.mkdirSync(folder);
  const packageBytes = Buffer.from('the already-tested release package');
  fs.writeFileSync(path.join(saved, 'cdk-snippets.vsix'), packageBytes);
  fs.writeFileSync(path.join(saved, 'cdk-snippets.vsix.sha256'), crypto.createHash('sha256').update(packageBytes).digest('hex') + '  artifacts/cdk-snippets.vsix\n');
  fs.writeFileSync(path.join(saved, 'release-notes.md'), 'Release notes');
  fs.writeFileSync(path.join(saved, 'release.json'), JSON.stringify({ version: '1.2.4', changed: true }));
  fs.writeFileSync(path.join(directory, 'package.json'), '{"version":"1.2.3"}');
  fs.writeFileSync(path.join(remote, 'fail-upload-once'), '');
  // The GitHub CLI is the external service boundary. This fake retains remote
  // assets and fails mid-upload; the release CLI must recover that persisted state.
  fs.writeFileSync(path.join(bin, 'gh'), `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const remote = process.env.FAKE_REMOTE;
const metadata = path.join(remote, 'metadata.json');
const starter = path.join(remote, 'starter.json');
const read = () => JSON.parse(fs.readFileSync(metadata));
const assets = () => fs.readdirSync(remote).filter(name => name.startsWith('cdk-snippets.vsix'));
const dest = () => args[args.indexOf('--dir') + 1];
if (args[0] === 'release' && args[1] === 'list') {
  console.log(JSON.stringify(fs.existsSync(metadata) ? [read()] : []));
} else if (args[0] === 'run' && args[1] === 'download') {
  if (args[2] !== '42' || args[args.indexOf('--name') + 1] !== 'release-1.2.4') process.exit(2);
  for (const name of fs.readdirSync(process.env.FAKE_SAVED)) fs.copyFileSync(path.join(process.env.FAKE_SAVED, name), path.join(dest(), name));
} else if (args[0] === 'release' && args[1] === 'create') {
  if (fs.existsSync(metadata)) process.exit(2);
  fs.writeFileSync(metadata, JSON.stringify({tagName: args[2], isDraft: true}));
} else if (args[0] === 'release' && args[1] === 'view') {
  console.log(JSON.stringify({...read(), assets: assets().map(name => ({name, state: fs.existsSync(starter) && JSON.parse(fs.readFileSync(starter)) === name ? 'starter' : 'uploaded'}))}));
} else if (args[0] === 'release' && args[1] === 'download') {
  for (const name of assets()) fs.copyFileSync(path.join(remote, name), path.join(dest(), name));
} else if (args[0] === 'release' && args[1] === 'upload') {
  for (const filename of args.slice(3)) {
    if (fs.existsSync(path.join(remote, path.basename(filename)))) process.exit(2);
    fs.copyFileSync(filename, path.join(remote, path.basename(filename)));
    if (fs.existsSync(path.join(remote, 'fail-upload-once'))) {
      fs.unlinkSync(path.join(remote, 'fail-upload-once'));
      fs.writeFileSync(path.join(remote, 'cdk-snippets.vsix.sha256'), '');
      fs.writeFileSync(starter, JSON.stringify('cdk-snippets.vsix.sha256'));
      process.exit(1);
    }
  }
} else if (args[0] === 'release' && args[1] === 'delete-asset') {
  fs.unlinkSync(path.join(remote, args[3]));
  fs.unlinkSync(starter);
} else { console.error('Unexpected CLI request', args); process.exit(2); }
`, { mode: 0o755 });
  const env = { ...process.env, PATH: bin + path.delimiter + process.env.PATH, FAKE_REMOTE: remote, FAKE_SAVED: saved };
  function run(executable, args, extraEnv = {}) {
    return spawnSync(executable, args, { cwd: directory, env: { ...env, ...extraEnv }, encoding: 'utf8' });
  }
  function success(executable, args, extraEnv) {
    const result = run(executable, args, extraEnv);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }
  success('git', ['init', '-q']);
  success('git', ['add', 'package.json']);
  success('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.test', 'commit', '-qm', 'fixture']);
  success('git', ['tag', '1.2.3']);
  fs.writeFileSync(path.join(directory, 'package.json'), '{"version":"1.2.4"}');
  success('git', ['add', 'package.json']);
  success('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.test', 'commit', '-qm', 'chore: release 1.2.4\n\nRelease-Run: 42']);
  success('git', ['tag', '1.2.4']);
  for (const tag of ['9.9.9', '1.2.3']) {
    const metadata = path.join(remote, 'metadata.json');
    fs.writeFileSync(metadata, JSON.stringify({ tagName: tag, isDraft: true }));
    assert.equal(success(process.execPath, [script, 'pending']), '1.2.4', 'Automatic recovery must ignore untagged and unmarked manual drafts');
    assert.equal(success(process.execPath, [script, 'pending'], { REQUESTED_TAG: tag }), tag, 'An explicitly requested draft remains selectable');
    fs.unlinkSync(metadata);
  }
  assert.equal(success(process.execPath, [script, 'pending']), '1.2.4');
  assert.notEqual(run(process.execPath, [script, 'recover', '1.2.4']).status, 0);
  assert.ok(fs.existsSync(path.join(remote, 'cdk-snippets.vsix')), 'The simulated interrupted upload persisted its first asset');
  assert.equal(fs.statSync(path.join(remote, 'cdk-snippets.vsix.sha256')).size, 0, 'GitHub 502 can leave an empty starter asset');
  success(process.execPath, [script, 'recover', '1.2.4']);
  assert.deepEqual(fs.readFileSync(path.join(remote, 'cdk-snippets.vsix')), packageBytes);
  assert.ok(fs.existsSync(path.join(remote, 'cdk-snippets.vsix.sha256')));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, 'package.json'))), { version: '1.2.4' });
  assert.equal(success('git', ['tag']), '1.2.3\n1.2.4');
  assert.equal(success(process.execPath, [script, 'pending']), '1.2.4', 'Workflow-owned drafts remain resumable');
  success(process.execPath, [script, 'recover', '1.2.4']);
  fs.writeFileSync(path.join(remote, 'cdk-snippets.vsix'), 'unexpected replacement');
  const corrupted = run(process.execPath, [script, 'recover', '1.2.4']);
  assert.notEqual(corrupted.status, 0);
  assert.match(corrupted.stderr, /checksum/i);
});
