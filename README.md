# Get Environments GitHub Action

A GitHub Action that fetches all environment names for a repository and exposes them as a JSON array output.

## Features

- Reads environments from the GitHub Environments API
- Supports explicit `owner/repo` input or automatic fallback to the current repository
- Outputs environment names as JSON
- Includes a release-ready build pipeline with type-checking and minified bundle output

## Inputs

Defined in `action.yml`:

- `repository` (optional)
  - Format: `owner/repo`
  - If omitted, the action uses the current repository from workflow context

## Outputs

Defined in `action.yml`:

- `environments`
  - JSON array of environment names
  - Example: `["dev","staging","production"]`

## Usage

```yaml
name: List environments

on:
  workflow_dispatch:

jobs:
  list-environments:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get environments from current repository
        id: get_envs
        uses: jonnitto/get-environments

      - name: Print output
        run: echo "${{ steps.get_envs.outputs.environments }}"
```

Use a specific repository:

```yaml
- name: Get environments from another repository
  id: get_envs
  uses: jonnitto/get-environments
  with:
    repository: octo-org/example-repo
```

## Requirements

- Node.js 24 runtime for the action (`runs.using: node24`)
- A valid `GITHUB_TOKEN` available in the workflow environment

## Development

Install dependencies:

```bash
npm install
```

Available scripts:

- `npm run clean`: Remove `dist`
- `npm run typecheck`: Run TypeScript checks only
- `npm run build:dev`: Development bundle with sourcemap
- `npm run build:prod`: Production bundle (minified)
- `npm run build`: Alias for `build:prod`
- `npm run deps:status`: Show outdated dependencies
- `npm run release:check`: Run release checks (typecheck + dependency status)
- `npm run release`: Run checks and create production build

## Notes

- The generated bundle is written to `dist/index.js`.
- Commit the updated `dist/index.js` when publishing a new action version/tag.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
