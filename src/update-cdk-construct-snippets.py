#!/usr/bin/env python3
"""Generate both snippet languages from the installed CDK's public API metadata."""

import argparse
import functools
import gzip
import importlib
import importlib.metadata
import json
import pathlib
import tempfile
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]


@functools.cache
def python_names(fqn):
    parts = fqn.removeprefix("aws-cdk-lib.").split(".")
    module = "aws_cdk"
    if parts[0].startswith(("aws_", "alexa_")):
        module += "." + parts.pop(0)
    definition = importlib.import_module(module)
    for part in parts:
        definition = getattr(definition, part)
    return {jsii: python for python, jsii in definition.__jsii_name_mapping__.items()}


def read_assembly(path):
    data = json.loads(path.read_text())
    if data.get("schema") == "jsii/file-redirect":
        if data.get("compression") != "gzip":
            raise ValueError("Unsupported assembly compression")
        data = json.loads(
            gzip.decompress((path.parent / data["filename"]).read_bytes())
        )
    if (
        data.get("name") != "aws-cdk-lib"
        or not data.get("types")
        or not data.get("version")
    ):
        raise ValueError("Expected an aws-cdk-lib assembly with types and version")
    if data["version"] != importlib.metadata.version("aws-cdk-lib"):
        raise ValueError("Python SDK and assembly versions differ")
    return data


class Renderer:
    def __init__(self, data, language, full, max_depth):
        self.data = data
        self.language = language
        self.full = full
        self.max_depth = max_depth
        self.counter = 1

    def placeholder(self, value):
        self.counter += 1
        value = value.replace("\\", "\\\\").replace("$", "\\$").replace("}", "\\}")
        return "${" + str(self.counter) + ":" + value + "}"

    def value(self, type_info, depth=1, ancestors=()):
        allow_token = type_info.get("fqn") == "aws-cdk-lib.IResolvable"
        if "union" in type_info:
            choices = type_info["union"]["types"]
            allow_token = any(
                t.get("fqn") == "aws-cdk-lib.IResolvable" for t in choices
            )
            type_info = next(
                (t for t in choices if t.get("fqn") != "aws-cdk-lib.IResolvable"),
                choices[0],
            )
        if "collection" in type_info:
            collection = type_info["collection"]
            if depth >= self.max_depth:
                return self.placeholder("[]" if collection["kind"] == "array" else "{}")
            key = self.placeholder("key") if collection["kind"] == "map" else ""
            value = self.value(collection["elementtype"], depth + 1, ancestors)
            if collection["kind"] == "array":
                return "[" + value + "]"
            return '{"' + key + '": ' + value + "}"
        if "fqn" in type_info:
            fqn = type_info["fqn"]
            if allow_token and (
                fqn == "aws-cdk-lib.IResolvable"
                or fqn in ancestors
                or depth >= self.max_depth
            ):
                method = "asAny" if self.language == "typescript" else "as_any"
                return self.placeholder(f"cdk.Token.{method}({{}})")
            if fqn in ancestors:
                raise ValueError(
                    f"Recursive property type cannot accept a token: {fqn}"
                )
            definition = self.data["types"].get(fqn)
            if not definition or not definition.get("datatype"):
                raise ValueError(f"Missing or unsupported property type: {fqn}")
            properties = self.properties(
                definition,
                depth + 1,
                (*ancestors, fqn),
                required_only=depth >= self.max_depth,
            )
            indent = ("  " if self.language == "typescript" else "    ") * depth
            if self.language == "typescript":
                return "{\n" + "\n".join(properties) + "\n" + indent + "}"
            name = fqn.removeprefix("aws-cdk-lib.")
            if not name.startswith(("aws_", "alexa_")):
                name = "cdk." + name
            return name + "(\n" + "\n".join(properties) + "\n" + indent + ")"
        primitive = type_info.get("primitive")
        if primitive == "string":
            quote = "'" if self.language == "typescript" else '"'
            return quote + self.placeholder("value") + quote
        if primitive == "number":
            return self.placeholder("0")
        if primitive == "boolean":
            return self.placeholder(
                "false" if self.language == "typescript" else "False"
            )
        if primitive == "any":
            return self.placeholder("{}")
        if primitive == "date":
            value = self.placeholder("2020-01-01T00:00:00+00:00")
            return (
                f"new Date('{value}')"
                if self.language == "typescript"
                else f'datetime.datetime.fromisoformat("{value}")'
            )
        raise ValueError(f"Unsupported type: {type_info}")

    def properties(self, definition, depth, ancestors=(), required_only=False):
        body = []
        properties = definition.get("properties", [])
        for prop in sorted(
            properties, key=lambda p: (p.get("optional", False), p["name"])
        ):
            if prop.get("optional") and (not self.full or required_only):
                continue
            value = self.value(prop["type"], depth, ancestors)
            required = (
                ""
                if prop.get("optional")
                else (
                    " // Required" if self.language == "typescript" else " # Required"
                )
            )
            indent = ("  " if self.language == "typescript" else "    ") * depth
            if self.language == "typescript":
                body.extend(f"{indent}{prop['name']}: {value},{required}".splitlines())
            else:
                name = python_names(definition["fqn"])[prop["name"]]
                body.extend(f"{indent}{name}={value},{required}".splitlines())
        return body

    def body(self, construct):
        namespace = construct.get("namespace", "cdk")
        alias = (
            namespace.removeprefix("aws_")
            if self.language == "typescript"
            else namespace
        )
        name = construct["name"]
        props = next(
            p["type"]["fqn"]
            for p in construct["initializer"]["parameters"]
            if p["name"] == "props"
        )
        if props not in self.data["types"]:
            raise ValueError(f"Missing props type: {props}")
        if self.language == "typescript":
            body = [f"new {alias}.{name}(this, '${{1:id}}', {{"]
        else:
            body = [f'{alias}.{name}(self, "${{1:id}}",']
        body.extend(self.properties(self.data["types"][props], 1))
        body.append("});" if self.language == "typescript" else ")")
        return body


def generate(data: dict[str, Any], max_depth: int, max_lines: int):
    resources: dict[str, dict[str, Any]] = {}
    for fqn, construct in sorted(data["types"].items()):
        resource = (
            construct.get("docs", {}).get("custom", {}).get("cloudformationResource")
        )
        if construct.get("kind") == "class" and resource:
            resources.setdefault(resource, construct)
    if not resources:
        raise ValueError("Assembly contains no CloudFormation constructs")
    outputs = {"typescript": {}, "python": {}}
    for resource, construct in sorted(resources.items()):
        service, name = resource.split("::")[-2:]
        for language, output in outputs.items():
            for full in (False, True):
                namespace = construct.get("namespace", "")
                fqn = (namespace + "." if namespace else "") + construct["name"]
                url = (
                    f"https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.{fqn}.html"
                    if language == "typescript"
                    else f"https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk{'.' + namespace if namespace else ''}/{construct['name']}.html"
                )
                for depth_limit in range(max_depth, -1, -1):
                    body = Renderer(data, language, full, depth_limit).body(construct)
                    if len(body) <= max_lines:
                        break
                else:
                    raise ValueError(
                        f"{resource} cannot fit the {max_lines}-line limit"
                    )
                output[resource + (" (full)" if full else "")] = {
                    "prefix": f"l1-{service.lower()}-{name.lower()}"
                    + ("-full" if full else ""),
                    "body": body,
                    "description": [
                        f"Construct: {fqn}",
                        f"CDK: {data['version']}",
                        f"Documentation: {url}",
                    ],
                }
    return outputs


def write_outputs(directory, outputs, check):
    contents = {
        directory / f"cdk-l1-constructs-{language}.json": json.dumps(
            snippets, indent=2, sort_keys=True
        )
        + "\n"
        for language, snippets in outputs.items()
    }
    changed = {
        path: content
        for path, content in contents.items()
        if not path.exists() or path.read_text() != content
    }
    if check:
        if changed:
            raise ValueError(
                "Stale generated snippets: " + ", ".join(path.name for path in changed)
            )
        return
    directory.mkdir(parents=True, exist_ok=True)
    staged = []
    try:
        for path, content in changed.items():
            with tempfile.NamedTemporaryFile(
                mode="w", encoding="utf-8", dir=directory, delete=False
            ) as stream:
                temporary = pathlib.Path(stream.name)
                staged.append((path, temporary))
                stream.write(content)
            temporary.chmod(0o644)
        for path, temporary in staged:
            temporary.replace(path)
    finally:
        for _, temporary in staged:
            temporary.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--assembly", type=pathlib.Path, default=ROOT / "node_modules/aws-cdk-lib/.jsii"
    )
    parser.add_argument("--output-dir", type=pathlib.Path, default=ROOT / "snippets")
    parser.add_argument("--max-depth", type=int, choices=range(1, 11), default=4)
    parser.add_argument("--max-lines", type=int, default=400)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail on stale snippets without modifying files",
    )
    args = parser.parse_args()
    try:
        if args.max_lines < 2:
            raise ValueError("--max-lines must be at least 2")
        outputs = generate(read_assembly(args.assembly), args.max_depth, args.max_lines)
        write_outputs(args.output_dir, outputs, args.check)
        print(f"Generated {len(outputs['typescript'])} snippets per language")
    except (
        ValueError,
        KeyError,
        StopIteration,
        OSError,
        ImportError,
        AttributeError,
    ) as exc:
        parser.exit(1, f"Generation failed: {exc}\n")


if __name__ == "__main__":
    main()
