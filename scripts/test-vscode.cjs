const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { runTests } = require('@vscode/test-electron');
const root = path.resolve(__dirname, '..');
// Keep macOS IPC socket paths below its 103-character limit.
const temporaryRoot = process.platform === 'darwin' ? '/tmp' : os.tmpdir();
const directory = fs.mkdtempSync(path.join(temporaryRoot, 'cdk-vscode-'));
runTests({
  version: '1.141.0',
  vscodeExecutablePath: process.env.VSCODE_EXECUTABLE_PATH,
  extensionDevelopmentPath: root,
  extensionTestsPath: path.join(root, 'tests/vscode.cjs'),
  launchArgs: ['--user-data-dir', path.join(directory, 'data'), '--extensions-dir', path.join(directory, 'extensions'), '--disable-extensions', '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust', '--no-sandbox'],
}).catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => fs.rmSync(directory, { recursive: true, force: true }));
