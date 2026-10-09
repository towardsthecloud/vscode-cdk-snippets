const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const JSZip = require('jszip');
const { root } = require('./snippet-text.cjs');

(async () => {
  const filename = process.argv[2] || path.join(root, 'artifacts/cdk-snippets.vsix');
  const buffer = fs.readFileSync(filename);
  assert.ok(buffer.length < 2 * 1024 * 1024, 'VSIX exceeds the 2 MB package budget');
  const archive = await JSZip.loadAsync(buffer);
  const files = Object.keys(archive.files);
  const allowed = new Set([
    'extension.vsixmanifest', '[Content_Types].xml', 'extension/package.json',
    'extension/readme.md', 'extension/changelog.md', 'extension/LICENSE.txt',
    'extension/images/cdk-snippets-extension-icon.png',
    'extension/snippets/cdk-l1-constructs-python.json',
    'extension/snippets/cdk-l1-constructs-typescript.json',
  ]);
  assert.deepEqual(files.filter(name => !archive.files[name].dir && !allowed.has(name)), [], 'Undeclared files leaked into the package');
  const manifest = JSON.parse(await archive.file('extension/package.json').async('string'));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.version, pkg.version, 'Packaged version differs from source');
  for (const snippet of manifest.contributes.snippets) {
    const relative = snippet.path.replace(/^\.\//, '');
    const content = await archive.file('extension/' + relative).async('string');
    assert.equal(content, fs.readFileSync(path.join(root, relative), 'utf8'), `${snippet.language}: packaged snippets differ`);
  }
  fs.writeFileSync(path.join(root, 'artifacts/package-validation.json'), JSON.stringify({ version: manifest.version, bytes: buffer.length, files }, null, 2));
  console.log(`Verified VSIX ${manifest.version}: ${(buffer.length / 1024 / 1024).toFixed(2)} MB, both snippet languages included`);
})().catch(error => { console.error(error); process.exitCode = 1; });
