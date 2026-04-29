# AWS CDK Construct Snippets for VS Code

This extension adds L1 Construct snippets from AWS CDK in Visual Studio Code.

<!-- TIP-LIST:START -->
> [!TIP]
> **Stop AWS bill surprises from happening.**
>
> Most infrastructure changes look harmless until you see next month's AWS bill. [CloudBurn](https://cloudburn.io) prevents this by analyzing the cost impact of your AWS CDK changes directly in GitHub pull requests, catching expensive mistakes during code review when fixes are quick, not weeks later when they're costly and risky.
>
> <a href="https://github.com/marketplace/cloudburn-io"><img alt="Install CloudBurn from GitHub Marketplace" src="https://img.shields.io/badge/Install%20CloudBurn-GitHub%20Marketplace-brightgreen.svg?style=for-the-badge&logo=github"/></a>
>
> <details>
> <summary>💰 <strong>Set it up once, then never be surprised by AWS costs again</strong></summary>
> <br/>
>
> 1. **First install the free [CDK Diff PR Commenter GitHub Action](https://github.com/marketplace/actions/aws-cdk-diff-pr-commenter)** in your repository where you build your AWS CDK infrastructure
> 2. **Then install the [CloudBurn GitHub App](https://github.com/marketplace/cloudburn-io)** on the same repository
>
> **What happens now:**
>
> Whenever you open a PR with infrastructure changes, the GitHub Action comments with your CDK diff analysis. CloudBurn reads that diff and automatically adds a separate comment with a detailed cost report showing:
> - **Monthly cost impact** – Will this change increase or decrease your AWS bill? By how much?
> - **Per-resource breakdown** – See exactly which resources are driving costs (old vs. new monthly costs)
> - **Region-aware pricing** – We pick the right AWS pricing based on the region where your infrastructure is deployed
>
> Your team can now validate cost impact alongside infrastructure changes during code review. Essentially, this shifts FinOps left where you optimize costs as you code, not weeks later when context is lost and production adjustments require more time and carry added risk.
>
> CloudBurn will be free during beta. After launch, a free Community plan (1 repository with unlimited users) will always be available.
>
> </details>
<!-- TIP-LIST:END -->

---

## New in version 2!

- Added support for L1 constructs snippets in AWS CDK Python! Open up a CDK Python project and type `l1` to trigger the L1 construct autocomplete.

## Features

1. **Comprehensive Support**: Seamlessly integrates all CloudFormation resources as L1 constructs within CDK, ensuring you have access to the latest AWS offerings.
2. **Effortless Autocomplete**: Activate autocomplete with `l1-<cloudformation-resource>` to streamline your coding process.
3. **Weekly Updates**: Construct snippets are refreshed weekly in line with AWS's updates to their [CloudFormation Resource Specification](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-resource-specification.html), keeping you on the cutting edge.
4. **Placeholder Support**: Navigate efficiently through resource properties using the `Tab` key, thanks to built-in placeholder functionality.
5. **Required Property Highlighting**: Easily identify mandatory properties, highlighted with a `// required` comment for your convenience.
6. **Documentation at Your Fingertips**: Access the corresponding CDK resource documentation directly from the autocomplete prompt, enriching your development experience.

## Usage

1. Install the [CDK Snippets extension](https://marketplace.visualstudio.com/items?itemName=dannysteenman.cdk-snippets) in VS Code.
2. Open your CDK project (TypeScript or Python).
3. Add L1 constructs using their short prefix (e.g. `l1-s3-bucket` for `s3.CfnBucket`).

Example:

![CDK Construct Snippets example](https://raw.githubusercontent.com/dannysteenman/vscode-cdk-snippets/main/images/cdk-snippet-tutorial.gif)

> **Note:** Once you start typing a prefix (explained in step 3), the corresponding snippet shows up in the dropdown menu. If this doesn't happen automatically, press `ctrl + space` to invoke IntelliSense and search for the prefix of the resource type that you want to add (as listed in step 3).

---
## AWS CDK Examples

[Explore our AWS CDK Examples repository](https://github.com/towardsthecloud/aws-cdk-examples) - a rich collection of TypeScript-based solutions that bring your cloud architecture to life. Crafted by a seasoned AWS professional.

---
## Support

If you have a feature request or an issue, please let me know on [Github](https://github.com/towardsthecloud/vscode-cdk-snippets/issues)

## Author

[Danny Steenman](https://towardsthecloud.com/about)

[![](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/towardsthecloud)
[![](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://twitter.com/dannysteenman)
[![](https://img.shields.io/badge/GitHub-2b3137?style=for-the-badge&logo=github&logoColor=white)](https://github.com/towardsthecloud)
