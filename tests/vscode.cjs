const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vscode = require('vscode');
const { root, loadSnippets, expandSnippet } = require('../scripts/snippet-text.cjs');

exports.run = async function () {
  const results = [];
  for (const language of ['typescript', 'python']) {
    const snippets = loadSnippets(language);
    for (const resource of ['AWS::IAM::Role', 'AWS::S3::Bucket (full)']) {
      const snippet = snippets[resource];
      const document = await vscode.workspace.openTextDocument({ language, content: snippet.prefix });
      const editor = await vscode.window.showTextDocument(document);
      editor.options = { insertSpaces: true, tabSize: language === 'typescript' ? 2 : 4 };
      const position = new vscode.Position(0, snippet.prefix.length);
      const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', document.uri, position, undefined, 100);
      const item = completions.items.find(candidate =>
        candidate.insertText instanceof vscode.SnippetString && candidate.insertText.value === snippet.body.join('\n'));
      assert.ok(item, `${language}: ${snippet.prefix} is missing from completion`);
      await editor.edit(edit => edit.delete(new vscode.Range(new vscode.Position(0, 0), position)));
      await editor.insertSnippet(item.insertText, new vscode.Position(0, 0));
      assert.equal(document.getText(), expandSnippet(snippet.body), `${language}: VS Code expansion differs`);
      assert.equal(document.getText(editor.selection), 'id');
      await vscode.commands.executeCommand('jumpToNextSnippetPlaceholder');
      if (resource === 'AWS::IAM::Role') {
        assert.equal(document.getText(editor.selection), '{}', 'JSON placeholder must select both braces');
      }
      await vscode.commands.executeCommand('leaveSnippet');
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      results.push({ language, prefix: snippet.prefix, completion: true, insertion: true, tabNavigation: true });
    }
  }
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/vscode-smoke.json'), JSON.stringify({ vscodeVersion: vscode.version, results }, null, 2));
  console.log(`VS Code ${vscode.version}: ${results.length} completion, insertion, and Tab navigation checks passed`);
};
