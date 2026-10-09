const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { root, loadSnippets, expandSnippet } = require('./snippet-text.cjs');

const typescript = loadSnippets('typescript');
const python = loadSnippets('python');
assert.deepEqual(Object.keys(typescript).sort(), Object.keys(python).sort(), 'Language coverage differs');
const aliases = new Map();
const expanded = { typescript: {}, python: {} };
const metrics = {};
for (const [language, snippets] of Object.entries({ typescript, python })) {
  const prefixes = new Set();
  for (const [resource, snippet] of Object.entries(snippets)) {
    assert.ok(Array.isArray(snippet.body) && snippet.body.length >= 2, `${resource}: missing body`);
    assert.ok(snippet.body.length <= 400, `${resource}: exceeds 400 lines`);
    assert.ok(!prefixes.has(snippet.prefix), `${resource}: duplicate prefix`);
    prefixes.add(snippet.prefix);
    expanded[language][resource] = expandSnippet(snippet.body);
    if (language === 'typescript') {
      const alias = /^new (\w+)\./.exec(snippet.body[0])[1];
      if (alias !== 'cdk') aliases.set(alias, alias === 'alexa_ask' ? alias : `aws_${alias}`);
    }
  }
  metrics[language] = { snippets: prefixes.size, maxLines: Math.max(...Object.values(snippets).map(s => s.body.length)) };
}
const artifacts = path.join(root, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
fs.writeFileSync(path.join(artifacts, 'expanded-python.json'), JSON.stringify(expanded.python));
const imports = [...aliases].map(([alias, namespace]) => `${namespace} as ${alias}`).join(', ');
const filename = path.join(artifacts, 'expanded-typescript.ts');
fs.writeFileSync(filename, `import * as cdk from 'aws-cdk-lib';\nimport { ${imports} } from 'aws-cdk-lib';\nfunction examples(this: cdk.Stack) {\n${Object.values(expanded.typescript).join('\n')}\n}\n`);
const program = ts.createProgram([filename], {
  strict: true, noEmit: true, skipLibCheck: true,
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
});
const diagnostics = ts.getPreEmitDiagnostics(program);
fs.writeFileSync(path.join(artifacts, 'snippet-validation.json'), JSON.stringify({ metrics, errors: diagnostics.length }, null, 2));
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics.slice(0, 20), {
    getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n',
  }));
  throw new Error(`${diagnostics.length} TypeScript SDK errors`);
}
console.log(`Validated ${Object.keys(typescript).length} TypeScript snippets against the installed SDK`);
