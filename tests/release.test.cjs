const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const script = path.resolve(__dirname, '../scripts/prepare-release.cjs');

function command(cwd, executable, args) {
  const result = spawnSync(executable, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function commit(cwd) {
  command(cwd, 'git', ['add', '.']);
  command(cwd, 'git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.test', 'commit', '-qm', 'fixture']);
}

test('unchanged content skips release; changed content bumps once and keeps metadata aligned', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cdk-release-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true }));
  fs.mkdirSync(path.join(directory, 'snippets'));
  fs.mkdirSync(path.join(directory, 'images'));
  const tutorial = path.join(directory, 'images/cdk-snippet-tutorial.gif');
  fs.writeFileSync(tutorial, 'original tutorial');
  const packageFile = path.join(directory, 'package.json');
  fs.writeFileSync(packageFile, JSON.stringify({ version: '1.2.3', devDependencies: { 'aws-cdk-lib': '2.273.0' } }));
  fs.writeFileSync(path.join(directory, 'package-lock.json'), JSON.stringify({ version: '1.2.3', packages: { '': { version: '1.2.3' } } }));
  fs.writeFileSync(path.join(directory, 'CHANGELOG.md'), 'Changelog\n=========\n');
  fs.writeFileSync(path.join(directory, 'LICENSE'), 'Original license terms');
  const snippetFile = path.join(directory, 'snippets/cdk-l1-constructs-typescript.json');
  fs.writeFileSync(snippetFile, JSON.stringify({ 'AWS::S3::Bucket': { body: ['original'] } }));
  command(directory, 'git', ['init', '-q']);
  commit(directory);
  command(directory, 'git', ['tag', '1.2.3']);
  command(directory, process.execPath, [script]);
  assert.equal(JSON.parse(fs.readFileSync(packageFile)).version, '1.2.3');
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'artifacts/release.json'))).changed, false);

  fs.writeFileSync(tutorial, 'updated tutorial');
  command(directory, process.execPath, [script]);
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'artifacts/release.json'))).changed, false, 'Excluded tutorial changes must not publish a version');

  fs.writeFileSync(snippetFile, JSON.stringify({ 'AWS::S3::Bucket': { body: ['updated'] } }));
  command(directory, process.execPath, [script]);
  assert.equal(JSON.parse(fs.readFileSync(packageFile)).version, '1.2.4');
  const lock = JSON.parse(fs.readFileSync(path.join(directory, 'package-lock.json')));
  assert.equal(lock.version, '1.2.4');
  assert.equal(lock.packages[''].version, '1.2.4');
  assert.match(fs.readFileSync(path.join(directory, 'CHANGELOG.md'), 'utf8'), /1\.2\.4.*\n[\s\S]*CDK 2\.273\.0/);
  // Reports are build artifacts, not release inputs.
  fs.writeFileSync(path.join(directory, '.gitignore'), 'artifacts/\n');
  commit(directory);
  command(directory, 'git', ['tag', '1.2.4']);
  command(directory, process.execPath, [script]);
  assert.equal(JSON.parse(fs.readFileSync(packageFile)).version, '1.2.4');
  for (const [filename, version] of [['LICENSE', '1.2.5'], ['CHANGELOG.md', '1.2.6']]) {
    fs.appendFileSync(path.join(directory, filename), '\nUpdated published text\n');
    command(directory, process.execPath, [script]);
    assert.equal(JSON.parse(fs.readFileSync(packageFile)).version, version, `${filename}-only edits must publish a new version`);
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'artifacts/release.json'))).changed, true);
    commit(directory);
    command(directory, 'git', ['tag', version]);
    command(directory, process.execPath, [script]);
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'artifacts/release.json'))).changed, false);
  }
});
