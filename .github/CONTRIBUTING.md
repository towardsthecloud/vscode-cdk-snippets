# Contribution Guidelines

Thank you for your interest in contributing to the [CDK Construct Snippets.](https://github.com/towardsthecloud/vscode-cdk-snippets)

Please read through this document before submitting any issues or pull requests to ensure we have all the necessary information to effectively respond to your issue or contribution.

## Reporting Bugs or Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check [existing open](https://github.com/towardsthecloud/vscode-cdk-snippets/issues), or [recently closed](https://github.com/towardsthecloud/vscode-cdk-snippets/issues?utf8=%E2%9C%93&q=is%3Aissue%20is%3Aclosed%20), issues to make sure somebody else hasn't already reported the issue. Please try to include as much information as you can.

## Contributing new changes via Pull Requests

Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the _main_ branch.
2. You check existing open, and recently merged, pull requests to make sure someone else hasn't made a similar request already.
3. You open an issue to discuss any significant work - we would hate for your time to be wasted.

To send us a pull request, please:

1. Fork the repository.
2. Modify the source, focusing on the specific change you are contributing. If you also reformat all the code, it will be hard for us to focus on your change.
3. Commit to your fork using clear commit messages.
4. Send us a pull request, answering any default questions in the pull request interface.
5. Stay involved in the conversation.

GitHub provides additional documentation on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

## Updating your PR

If the maintainers notice anything that we'd like changed, we'll ask you to edit your PR before we merge it. There's no need to open a new PR, just edit the existing one. If you're not sure how to do that, [then here is a guide](https://github.com/RichardLitt/knowledge/blob/master/github/amending-a-commit-guide.md) on the different ways you can update your PR so that we can merge it.

## Generate and validate snippets

Use Node 24 via `fnm` and the latest stable Python 3. CI selects the newest stable runtime available to `setup-python` with `3.x` and `check-latest: true`. Create the Python environment in the repository root:

```sh
fnm use
npm ci --ignore-scripts
uv venv --python $(python --version 2>&1 | sed "s/Python //")
uv pip sync --python .venv/bin/python src/requirements.txt
source .venv/bin/activate
npm run generate
npm test
npm run test:vscode
npm run package
npm run test:package
```

On Linux, run the editor test with `xvfb-run -a npm run test:vscode`. To use a local VS Code installation, set `VSCODE_EXECUTABLE_PATH` to its executable; the test creates an isolated profile and leaves your normal editor profile untouched.

The generator reads the installed `aws-cdk-lib/.jsii` assembly and Python binding name maps. It generates both languages before staging output files, replaces each file atomically, and exits unsuccessfully on unsupported or missing types. `npm run generate:check` detects stale output without writing files. Do not edit generated snippets directly.

`npm test` checks the generator CLI, release preparation, interrupted-upload recovery, generated-file freshness, every TypeScript snippet against the actual SDK declarations, and every Python snippet against syntax and constructor signatures. It also fills and synthesizes representative Python snippets with CloudFormation validation enabled. The editor test checks completion, insertion, JSON placeholder selection, and Tab navigation. Reports and expanded validation inputs are retained in `artifacts/`.

To update the SDK manually, change the exact `aws-cdk-lib` version in `package.json` and `src/requirements.in`, update `package-lock.json`, run `uv pip compile src/requirements.in --output-file src/requirements.txt`, sync the environment, regenerate both languages, and run the checks above.

## Release and retry publication

The update workflow runs weekly, after extension content changes on `main`, or through `workflow_dispatch`. It refreshes the pinned CDK version, validates both languages and editor behavior, and compares published inputs with the last release tag. Unchanged content does not bump the extension version.

A changed extension receives one patch version. The verified VSIX, checksum, and release notes are retained in a workflow artifact for 90 days before advancing the version. Its changelog, package metadata, and snippets are committed together with the artifact's workflow run ID, then the final commit is tagged. The same package is saved in a draft GitHub release. Marketplace and Open VSX publish the saved file independently, skipping versions that already exist. The GitHub release becomes public after both registries succeed.

If publication or draft creation fails, rerun the workflow with that version's tag in `release_tag`. The weekly run also resumes pending drafts and tagged releases missing their draft before preparing another version. Missing assets are restored from the original workflow artifact; existing assets must match its bytes. Complete releases are checksum-verified without requiring the retained artifact. Retries do not regenerate the package or bump its version. Recover incomplete drafts within the artifact's 90-day retention window. Keep the existing `VSCE_TOKEN` and `OPEN_VSX_TOKEN` repository secrets configured.

## Licensing

See the [LICENSE](https://github.com/towardsthecloud/vscode-cdk-snippets/blob/main/LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.
