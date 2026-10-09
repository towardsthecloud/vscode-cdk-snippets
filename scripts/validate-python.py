"""Validate expanded snippets against the installed Python CDK signatures."""

import ast
import datetime
import functools
import importlib
import inspect
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]


@functools.cache
def resolve(name):
    parts = name.split(".")
    if parts[0] == "datetime":
        value = datetime
    elif parts[0] == "cdk":
        value = importlib.import_module("aws_cdk")
    else:
        value = importlib.import_module("aws_cdk." + parts[0])
    for part in parts[1:]:
        value = getattr(value, part)
    return value


def main():
    import aws_cdk as cdk

    package = json.loads((ROOT / "package.json").read_text())
    from importlib.metadata import version

    if version("aws-cdk-lib") != package["devDependencies"]["aws-cdk-lib"]:
        raise ValueError("Python and TypeScript CDK versions differ")
    snippets = json.loads((ROOT / "artifacts/expanded-python.json").read_text())
    errors = []
    for resource, source in snippets.items():
        try:
            tree = ast.parse(source)
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    name = ast.unparse(node.func)
                    if name == "datetime.datetime.fromisoformat":
                        datetime.datetime.fromisoformat(ast.literal_eval(node.args[0]))
                        continue
                    keywords = {}
                    for arg in node.keywords:
                        if arg.arg is None:
                            raise ValueError(
                                "Cannot validate unpacked keyword arguments"
                            )
                        keywords[arg.arg] = None
                    inspect.signature(resolve(name)).bind(
                        *([None] * len(node.args)), **keywords
                    )
        except (SyntaxError, TypeError, AttributeError, ImportError, ValueError) as exc:
            errors.append(f"{resource}: {exc}")
    if errors:
        raise ValueError("\n".join(errors[:20]) + f"\n{len(errors)} Python SDK errors")

    # Instantiate and synthesize actual snippet bodies through the CDK entry point.
    app = cdk.App(
        outdir=str(ROOT / "artifacts/python-cdk.out"),
        context={"@aws-cdk/core:validateAgainstDefaultRules": True},
    )
    expectations = []
    for resource, expected_type, values in [
        ("AWS::S3::Bucket", "AWS::S3::Bucket", {}),
        ("AWS::EC2::VPC", "AWS::EC2::VPC", {"cidr_block": "'10.0.0.0/16'"}),
        (
            "AWS::IAM::Role",
            "AWS::IAM::Role",
            {
                "assume_role_policy_document": "{'Version': '2012-10-17', 'Statement': [{'Effect': 'Allow', 'Principal': {'Service': 'lambda.amazonaws.com'}, 'Action': 'sts:AssumeRole'}]}"
            },
        ),
        (
            "AWS::Lambda::Function",
            "AWS::Lambda::Function",
            {
                "role": "'arn:aws:iam::123456789012:role/Example'",
                "code": "aws_lambda.CfnFunction.CodeProperty(zip_file='def handler(event, context): return 1')",
                "handler": "'index.handler'",
                "runtime": "'python3.12'",
            },
        ),
    ]:
        stack = cdk.Stack(app, resource.split("::")[1])
        scope = {"cdk": cdk, "self": stack}
        tree = ast.parse(snippets[resource])
        # Fill the editable examples with independently chosen, valid resource settings.
        call = tree.body[0].value
        assert isinstance(call, ast.Call)
        call.keywords = [arg for arg in call.keywords if arg.arg not in values]
        call.keywords.extend(
            ast.keyword(arg=name, value=ast.parse(value, mode="eval").body)
            for name, value in values.items()
        )
        ast.fix_missing_locations(tree)
        for node in ast.walk(tree):
            if isinstance(node, ast.Name) and node.id.startswith("aws_"):
                scope[node.id] = importlib.import_module("aws_cdk." + node.id)
        # Execute repository-generated snippets to exercise their actual constructors.
        exec(compile(tree, resource, "exec"), scope)  # noqa: S102
        expectations.append((stack.stack_name, expected_type))
    assembly = app.synth()
    for stack_name, expected_type in expectations:
        template = assembly.get_stack_by_name(stack_name).template
        assert any(r["Type"] == expected_type for r in template["Resources"].values())
    print(
        f"Validated {len(snippets)} Python snippets and synthesized 4 representative constructs"
    )


if __name__ == "__main__":
    main()
