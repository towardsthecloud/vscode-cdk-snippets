# AWS CDK Construct Snippets for VS Code

[![](https://img.shields.io/visual-studio-marketplace/v/dannysteenman.cdk-snippets?color=374151&label=Visual%20Studio%20Marketplace&labelColor=000&logo=visual-studio-code&logoColor=0098FF)](https://marketplace.visualstudio.com/items?itemName=dannysteenman.cdk-snippets)
[![](https://img.shields.io/visual-studio-marketplace/v/dannysteenman.cdk-snippets?color=374151&label=Open%20VSX%20Registry&labelColor=000&logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSI0LjYgNSA5Ni4yIDEyMi43IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0zMCA0NC4yTDUyLjYgNUg3LjN6TTQuNiA4OC41aDQ1LjNMMjcuMiA0OS40em01MSAwbDIyLjYgMzkuMiAyMi42LTM5LjJ6IiBmaWxsPSIjYzE2MGVmIi8+CiAgPHBhdGggZD0iTTUyLjYgNUwzMCA0NC4yaDQ1LjJ6TTI3LjIgNDkuNGwyMi43IDM5LjEgMjIuNi0zOS4xem01MSAwTDU1LjYgODguNWg0NS4yeiIgZmlsbD0iI2E2MGVlNSIvPgo8L3N2Zz4=&logoColor=0098FF)](https://open-vsx.org/extension/dannysteenman/cdk-snippets)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/dannysteenman.cdk-snippets 'Currently Installed')](https://marketplace.visualstudio.com/items?itemName=dannysteenman.cdk-snippets)
[![Rating](https://img.shields.io/visual-studio-marketplace/stars/dannysteenman.cdk-snippets)](https://marketplace.visualstudio.com/items?itemName=dannysteenman.cdk-snippets)

This extension adds L1 Construct snippets from AWS CDK in Visual Studio Code.

> [!TIP]
> **AWS Done Right: Ship Faster, More Securely, at Lower Cost!** Our [AWS CDK Landing Zone Service](https://towardsthecloud.com) helps B2B startups & enterprises achieve SOC 2 compliance 90% faster, reclaim 30% of developer capacity for product innovation while eliminating six-figure Cloud Engineering costs.
>
> Discover how we deliver 10x AWS infrastructure value while cutting costs.
>
> <a href="https://towardsthecloud.com/contact"><img alt="Book your free intro call" src="https://img.shields.io/badge/book%20your%20free%20intro%20call-success.svg?style=for-the-badge"/></a>
>
> <details><summary>☁️ <strong>Learn more how we help businesses succeed on AWS Cloud...</strong></summary>
>
><br/>
>
> AWS promises simplicity but delivers complexity. Businesses struggle with security risks and compliance requirements that divert developers from core product work.
>
> Without AWS expertise, you face vulnerabilities, technical debt, and market delays while competitors race ahead.
>
> Traditional consultancies worsen this by prioritizing billable hours over outcomes.
>
> We take the opposite approach, focusing exclusively on business outcomes by eliminating AWS complexity, accelerating your developers, and securing your infrastructure through:
>
> ### Deploying a [Secure Landing Zone](https://towardsthecloud.com/services/aws-landing-zone)
> - Multi-account architecture with strict security boundaries
>   - **100% score** on [CIS AWS Foundation Benchmark](https://docs.aws.amazon.com/securityhub/latest/userguide/cis-aws-foundations-benchmark.html)
>   - **96% rating** on [AWS foundational security best practices](https://docs.aws.amazon.com/securityhub/latest/userguide/fsbp-standard.html)
> - Manage user access securely on AWS via Single Sign-On (SSO)
> - Full AWS CDK implementation (Infrastructure as Code)
> - Multi-region deployments supported
> - Cross-account monitoring and security alerts
> - View our [Roadmap](https://github.com/towardsthecloud/aws-cdk-landing-zone-roadmap) for all implemented and upcoming features
>
> ### Upskilling and accelerating your developers
> - They get access to our production-ready, security-hardened AWS CDK components
> - They receive AWS best practices guidance to prevent technical debt
>
> ### Providing support and maintenance
> - Landing Zone gets updates and security patches
> - Priority Slack/Teams support for infrastructure challenges
> - Quarterly [security](https://towardsthecloud.com/services/aws-security-review) and [cost optimization](https://towardsthecloud.com/services/aws-cost-optimization) assessments to stay compliant and reduce AWS costs
>
> ## What This Means For Your Business
> - **30% Lower TCO**: Cut Total Cost by 40% through right-sized resources while eliminating the $150K+ cost of a specialized AWS hire.
> - **Accelerate Development**: Redirect 30% of engineering time from infrastructure to revenue-generating features with pre-built, compliant CDK components.
> - **Compliance-Ready Infrastructure**: Meet security requirements from day one with architecture that [speeds up audit preparation by 90%](https://towardsthecloud.com/blog/aws-landing-zone-case-study-accolade) for SOC 2, HIPAA, and other security frameworks.
>
> All of this is included in a [fixed monthly subscription](https://towardsthecloud.com/pricing). No lock-in, no large upfront costs, just predictable monthly pricing.
>
> Book a free call to see how we deliver 10x AWS infrastructure value at a fraction of a Cloud Engineer's cost.
>
> <a href="https://towardsthecloud.com/contact"><img alt="Book your free introduction call" src="https://img.shields.io/badge/book%20your%20free%20introduction%20call-success.svg?style=for-the-badge"/></a>
> </details>

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
