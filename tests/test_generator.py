import ast
import importlib.metadata
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
GENERATOR = ROOT / "src/update-cdk-construct-snippets.py"


def assembly(
    properties, namespace="aws_amplify", name="CfnApp", resource="AWS::Amplify::App"
):
    fqn = f"aws-cdk-lib.{namespace}.{name}"
    return {
        "name": "aws-cdk-lib",
        "version": importlib.metadata.version("aws-cdk-lib"),
        "types": {
            fqn: {
                "kind": "class",
                "name": name,
                "namespace": namespace,
                "docs": {"custom": {"cloudformationResource": resource}},
                "initializer": {
                    "parameters": [
                        {
                            "name": "props",
                            "type": {"fqn": fqn + "Props"},
                        }
                    ]
                },
            },
            fqn + "Props": {
                "fqn": fqn + "Props",
                "kind": "interface",
                "datatype": True,
                "properties": properties,
            },
        },
    }


class GeneratorTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = pathlib.Path(self.directory.name)
        self.source = self.root / "assembly.json"
        self.output = self.root / "snippets"

    def generate(self, data, *arguments):
        self.source.write_text(json.dumps(data))
        return subprocess.run(
            [
                sys.executable,
                str(GENERATOR),
                "--assembly",
                str(self.source),
                "--output-dir",
                str(self.output),
                *arguments,
            ],
            check=False,
            capture_output=True,
            text=True,
            timeout=30,
        )

    def snippets(self, language):
        return json.loads(
            (self.output / f"cdk-l1-constructs-{language}.json").read_text()
        )

    def test_both_languages_use_sdk_names_and_distinguish_optional_properties(self):
        result = self.generate(
            assembly(
                [
                    {
                        "name": "iamServiceRole",
                        "type": {"primitive": "string"},
                        "optional": True,
                    },
                    {"name": "name", "type": {"primitive": "string"}},
                ]
            )
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        ts = self.snippets("typescript")
        py = self.snippets("python")
        self.assertEqual(set(ts), set(py))
        compact = "\n".join(ts["AWS::Amplify::App"]["body"])
        self.assertIn("name:", compact)
        self.assertNotIn("iamServiceRole:", compact)
        full = ts["AWS::Amplify::App (full)"]
        self.assertEqual(full["prefix"], "l1-amplify-app-full")
        role = next(line for line in full["body"] if "iamServiceRole:" in line)
        self.assertNotIn("Required", role)
        python = "\n".join(py["AWS::Amplify::App (full)"]["body"])
        self.assertIn("iam_service_role=", python)

    def test_recursive_nested_types_and_large_snippets_remain_bounded(self):
        data = assembly(
            [
                {
                    "name": "autoBranchCreationConfig",
                    "type": {
                        "union": {
                            "types": [
                                {
                                    "fqn": "aws-cdk-lib.aws_amplify.CfnApp.AutoBranchCreationConfigProperty"
                                },
                                {"fqn": "aws-cdk-lib.IResolvable"},
                            ]
                        }
                    },
                },
                {
                    "name": "environmentVariables",
                    "type": {
                        "collection": {
                            "kind": "map",
                            "elementtype": {"primitive": "string"},
                        }
                    },
                    "optional": True,
                },
            ]
        )
        data["types"][
            "aws-cdk-lib.aws_amplify.CfnApp.AutoBranchCreationConfigProperty"
        ] = {
            "kind": "interface",
            "datatype": True,
            "fqn": "aws-cdk-lib.aws_amplify.CfnApp.AutoBranchCreationConfigProperty",
            "properties": [
                {
                    "name": "environmentVariables",
                    "type": {
                        "union": {
                            "types": [
                                {
                                    "fqn": "aws-cdk-lib.aws_amplify.CfnApp.AutoBranchCreationConfigProperty"
                                },
                                {"fqn": "aws-cdk-lib.IResolvable"},
                            ]
                        }
                    },
                },
                {"name": "enableAutoBranchCreation", "type": {"primitive": "boolean"}},
            ],
        }
        result = self.generate(data, "--max-depth", "2", "--max-lines", "12")
        self.assertEqual(result.returncode, 0, result.stderr)
        for language in ("typescript", "python"):
            for snippet in self.snippets(language).values():
                self.assertLessEqual(len(snippet["body"]), 12)
            full = "\n".join(
                self.snippets(language)["AWS::Amplify::App (full)"]["body"]
            )
            self.assertIn(
                "Token.asAny" if language == "typescript" else "Token.as_any", full
            )
            self.assertIn(
                "environmentVariables"
                if language == "typescript"
                else "environment_variables",
                full,
            )

    def test_global_cdk_types_use_the_cdk_import(self):
        data = assembly(
            [
                {
                    "name": "tags",
                    "type": {
                        "collection": {
                            "kind": "array",
                            "elementtype": {"fqn": "aws-cdk-lib.CfnTag"},
                        }
                    },
                }
            ],
            namespace="aws_s3",
            name="CfnBucket",
            resource="AWS::S3::Bucket",
        )
        data["types"]["aws-cdk-lib.CfnTag"] = {
            "kind": "interface",
            "datatype": True,
            "fqn": "aws-cdk-lib.CfnTag",
            "properties": [
                {"name": "key", "type": {"primitive": "string"}},
                {"name": "value", "type": {"primitive": "string"}},
            ],
        }
        result = self.generate(data)
        self.assertEqual(result.returncode, 0, result.stderr)
        body = "\n".join(self.snippets("python")["AWS::S3::Bucket"]["body"])
        self.assertIn("cdk.CfnTag(", body)

    def test_output_preparation_failure_preserves_existing_language(self):
        data = assembly([{"name": "name", "type": {"primitive": "string"}}])
        self.assertEqual(self.generate(data).returncode, 0)
        typescript = self.output / "cdk-l1-constructs-typescript.json"
        previous = typescript.read_bytes()
        python = self.output / "cdk-l1-constructs-python.json"
        python.unlink()
        python.mkdir()
        data["types"]["aws-cdk-lib.aws_amplify.CfnAppProps"]["properties"][0][
            "name"
        ] = "description"
        result = self.generate(data)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(typescript.read_bytes(), previous)

    def test_check_mode_detects_stale_output_without_changing_files(self):
        data = assembly([{"name": "name", "type": {"primitive": "string"}}])
        self.assertEqual(self.generate(data).returncode, 0)
        self.assertEqual(self.generate(data, "--check").returncode, 0)
        path = self.output / "cdk-l1-constructs-python.json"
        path.write_text("stale")
        result = self.generate(data, "--check")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("stale", result.stderr.lower())
        self.assertEqual(path.read_text(), "stale")

    def test_python_uses_binding_names_for_measurement_acronyms(self):
        data = assembly(
            [
                {
                    "name": "containerProperties",
                    "type": {
                        "fqn": "aws-cdk-lib.aws_batch.CfnJobDefinition.ContainerPropertiesProperty"
                    },
                }
            ],
            namespace="aws_batch",
            name="CfnJobDefinition",
            resource="AWS::Batch::JobDefinition",
        )
        data["types"][
            "aws-cdk-lib.aws_batch.CfnJobDefinition.ContainerPropertiesProperty"
        ] = {
            "fqn": "aws-cdk-lib.aws_batch.CfnJobDefinition.ContainerPropertiesProperty",
            "datatype": True,
            "properties": [
                {
                    "name": "ephemeralStorage",
                    "type": {
                        "fqn": "aws-cdk-lib.aws_batch.CfnJobDefinition.EphemeralStorageProperty"
                    },
                }
            ],
        }
        data["types"][
            "aws-cdk-lib.aws_batch.CfnJobDefinition.EphemeralStorageProperty"
        ] = {
            "fqn": "aws-cdk-lib.aws_batch.CfnJobDefinition.EphemeralStorageProperty",
            "datatype": True,
            "properties": [{"name": "sizeInGiB", "type": {"primitive": "number"}}],
        }
        result = self.generate(data)
        self.assertEqual(result.returncode, 0, result.stderr)
        body = "\n".join(self.snippets("python")["AWS::Batch::JobDefinition"]["body"])
        self.assertIn("size_in_gib=", body)

    def test_python_date_default_executes_on_the_sdk_minimum_python(self):
        data = assembly(
            [
                {
                    "name": "lifecycleConfiguration",
                    "optional": True,
                    "type": {
                        "fqn": "aws-cdk-lib.aws_s3.CfnBucket.LifecycleConfigurationProperty"
                    },
                }
            ],
            namespace="aws_s3",
            name="CfnBucket",
            resource="AWS::S3::Bucket",
        )
        lifecycle = "aws-cdk-lib.aws_s3.CfnBucket.LifecycleConfigurationProperty"
        rule = "aws-cdk-lib.aws_s3.CfnBucket.RuleProperty"
        data["types"][lifecycle] = {
            "fqn": lifecycle,
            "datatype": True,
            "properties": [
                {
                    "name": "rules",
                    "type": {
                        "collection": {"kind": "array", "elementtype": {"fqn": rule}}
                    },
                }
            ],
        }
        data["types"][rule] = {
            "fqn": rule,
            "datatype": True,
            "properties": [
                {"name": "status", "type": {"primitive": "string"}},
                {
                    "name": "expirationDate",
                    "optional": True,
                    "type": {"primitive": "date"},
                },
            ],
        }
        result = self.generate(data)
        self.assertEqual(result.returncode, 0, result.stderr)
        snippet = self.snippets("python")["AWS::S3::Bucket (full)"]
        source = subprocess.check_output(
            [
                "node",
                "-e",
                "const {expandSnippet}=require(process.argv[1]); console.log(expandSnippet(JSON.parse(process.argv[2]).body));",
                str(ROOT / "scripts/snippet-text.cjs"),
                json.dumps(snippet),
            ],
            text=True,
        )
        dates = [
            node
            for node in ast.walk(ast.parse(source))
            if isinstance(node, ast.Call)
            and ast.unparse(node.func) == "datetime.datetime.fromisoformat"
        ]
        self.assertEqual(len(dates), 1)
        # Execute the emitted expression with the consumer's actual minimum
        # interpreter. CI's newest interpreter accepts formats that 3.10 rejects.
        code = (
            "import datetime, sys; assert sys.version_info[:2] == (3, 10); "
            f"result = {ast.unparse(dates[0])}; "
            "assert result == datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc)"
        )
        execution = subprocess.run(
            [
                "uv",
                "run",
                "--python",
                "3.10",
                "--no-project",
                "--isolated",
                "python",
                "-c",
                code,
            ],
            check=False,
            capture_output=True,
            text=True,
            timeout=90,
        )
        self.assertEqual(execution.returncode, 0, execution.stderr)


if __name__ == "__main__":
    unittest.main()
