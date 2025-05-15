# AWS CDK Construct Snippets for VS Code

[![](https://img.shields.io/visual-studio-marketplace/v/dannysteenman.cdk-snippets?color=374151&label=Visual%20Studio%20Marketplace&labelColor=000&logo=visual-studio-code&logoColor=0098FF)](https://marketplace.visualstudio.com/items?itemName=dannysteenman.cdk-snippets)
[![](https://img.shields.io/visual-studio-marketplace/v/dannysteenman.cdk-snippets?color=374151&label=Open%20VSX%20Registry&labelColor=000&logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSI0LjYgNSA5Ni4yIDEyMi43IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0zMCA0NC4yTDUyLjYgNUg3LjN6TTQuNiA4OC41aDQ1LjNMMjcuMiA0OS40em01MSAwbDIyLjYgMzkuMiAyMi42LTM5LjJ6IiBmaWxsPSIjYzE2MGVmIi8+CiAgPHBhdGggZD0iTTUyLjYgNUwzMCA0NC4yaDQ1LjJ6TTI3LjIgNDkuNGwyMi43IDM5LjEgMjIuNi0zOS4xem01MSAwTDU1LjYgODguNWg0NS4yeiIgZmlsbD0iI2E2MGVlNSIvPgo8L3N2Zz4=&logoColor=0098FF)](https://open-vsx.org/extension/dannysteenman/cdk-snippets)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/dannysteenman.cdk-snippets 'Currently Installed')](https://marketplace.visualstudio.com/items?itemName=dannysteenman.cdk-snippets)
[![Rating](https://img.shields.io/visual-studio-marketplace/stars/dannysteenman.cdk-snippets)](https://marketplace.visualstudio.com/items?itemName=dannysteenman.cdk-snippets)

This extension adds L1 Construct snippets from AWS CDK in Visual Studio Code.

> [!TIP]
> **Launch Faster on AWS and Become Fully Secure From Day One!** Our AWS Landing Zone Foundation service helps B2B companies achieve SOC 2 compliance 90% faster,  redirect 30% of engineering time back to product development all while eliminating the six-figure cost of specialized cloud engineers. so you can focus on shipping your product, instead of worrying about managing your infrastructure on AWS.
>
> [Schedule a free introduction call](https://towardsthecloud.com/contact) to discover how we can deliver 10x the value of securing and building your infrastructure on AWS for a fraction of the cost of a full-time cloud engineer.

<details><summary>☁️ <strong>Learn more about our unique AWS Foundation Service</strong></summary>

<br/>

Is AWS complexity draining your engineering resources? Most B2B startups and growing businesses struggle with overwhelming configuration options, time-consuming compliance requirements, and diverting valuable developer talent away from core product development. Without specialized AWS expertise, you risk security vulnerabilities, mounting technical debt, and delayed time-to-market. All while your competitors race ahead.

Traditional AWS consultancies only compound this problem. They're incentivized to bill by the hour, extending projects indefinitely rather than focusing on your business outcomes. We take the opposite approach. Our fixed-price subscription model proves how confident we are in delivering results, not just billable hours. We succeed when you succeed, aligning our incentives with your growth rather than your AWS complexity.

## Our Solution: Enterprise-Grade AWS Foundation

We deliver an enterprise-grade AWS Landing Zone built entirely in AWS CDK coupled with a support and consultacy foundation that grows with your business needs. Here's what we'll deliver to you:

### We deploy a [Secure and Compliant Landing Zone](https://towardsthecloud.com/services/aws-landing-zone)
- Multi-account architecture with proper security boundaries
  - Achieves a **100% score on the industry-standard [CIS AWS Foundation Benchmark](https://docs.aws.amazon.com/securityhub/latest/userguide/cis-aws-foundations-benchmark.html)**
  - **Achieves a 96% rating on AWS's own [foundational security best practices](https://docs.aws.amazon.com/securityhub/latest/userguide/fsbp-standard.html)**
- Setup entirely using AWS CDK (Infrastructure as Code)
- Budget monitoring and notifications across all accounts
- Deploy changes quickly through GitHub Actions
- We're continuously adding new features as listed on our [Roadmap](https://github.com/towardsthecloud/aws-cdk-landing-zone-roadmap)

### We upskill and accelerate your Developers
- They gain access to our library of ready-to-use, security-hardened AWS CDK components
- They receive guidance on how to utilize AWS best practices for your architecture so you avoid technical debt later on

### We monitor and maintain the multi-account setup & provide ongoing support
- Gain new Landing Zone features once they're released and get free maintenance and security updates
- Get priority support through Slack/Teams whenever you need assistance with infrastructure challenges
- We proactively do quarterly [security](https://towardsthecloud.com/services/aws-security-review) and [cost optimization](https://towardsthecloud.com/services/aws-cost-optimization) assessments to verify AWS account compliance and provide advice to reduce your AWS bill

### What This Means For Your Business
- **30% Lower TCO**: Cut your Total Cost of Ownership (TCO) by up to 30% through right-sized resources and architectural optimization while eliminating the $150K+ annual cost of a specialized AWS hire
- **Close Enterprise Deals Faster**: Win enterprise clients with SOC2 compliance ready in weeks instead of months - our clients report 50% faster sales cycles with security-conscious customers
- **Unleash Your Development Team**: Redirect up to 30% of engineering time from infrastructure back to revenue-generating product features with our pre-built, compliant components
- **Scale Without Infrastructure Headaches**: Grow from startup to enterprise without ever rebuilding your foundation - our architecture scales seamlessly from your first customer to your millionth

We deliver all of this as a [simple subscription service](https://towardsthecloud.com/pricing). No large upfront costs, no lock-in. You'll essentially get a solid and secure landing zone foundation + a decade of AWS expertise without having to hire a full-time Cloud Engineer.

<a href="https://towardsthecloud.com/contact"><img alt="Schedule a free introduction call" src="https://img.shields.io/badge/schedule%20a%20free%20introduction%20call-success.svg?style=for-the-badge"/></a>
</details>

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
