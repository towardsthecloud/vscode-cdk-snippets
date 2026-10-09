const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function loadSnippets(language) {
  return JSON.parse(fs.readFileSync(path.join(root, `snippets/cdk-l1-constructs-${language}.json`), 'utf8'));
}

// Interpret the placeholder subset defined by VS Code's TextMate snippet grammar.
function expandSnippet(body) {
  const text = body.join('\n').replace(/\$\{\d+:((?:\\.|[^}])*)\}/g, (_, value) =>
    value.replace(/\\([$}\\])/g, '$1'));
  if (text.includes('${')) throw new Error('Unexpanded or malformed snippet placeholder');
  return text;
}

module.exports = { root, loadSnippets, expandSnippet };
