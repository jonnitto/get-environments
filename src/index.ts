import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/action';

type EnvironmentResponse = {
  environments?: Array<{ name: string }>;
};

main();

async function run(): Promise<void> {
  try {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('GITHUB_TOKEN is required');
    }

    const octokit = github.getOctokit(token);

    // Input lesen
    let repository = core.getInput('repository');

    // 👉 Fallback auf aktuelles Repo
    if (!repository) {
      const { owner, repo } = github.context.repo;
      repository = `${owner}/${repo}`;
    }

    if (!repository.includes('/')) {
      throw new Error(
        `Invalid repository format: "${repository}". Expected "owner/repo".`,
      );
    }

    const [owner, repo] = repository.split('/');

    core.info(`Using repository: ${owner}/${repo}`);

    const response = await octokit.request(
      'GET /repos/{owner}/{repo}/environments',
      {
        owner,
        repo,
      },
    );

    const names = (
      (response.data as EnvironmentResponse).environments ?? []
    ).map((env) => env.name);

    core.setOutput('names', JSON.stringify(names));
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

async function main() {
  try {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('GITHUB_TOKEN is required');
    }

    let repository = core.getInput('repository');
    if (!repository) {
      const { owner, repo } = github.context.repo;
      repository = `${owner}/${repo}`;
    }

    if (!repository.includes('/')) {
      throw new Error(
        `Invalid repository format: "${repository}". Expected "owner/repo".`,
      );
    }

    core.info(`Using repository: ${repository}`);

    const environments = await getEnviroments(repository, token);
    core.setOutput('environments', JSON.stringify(environments));
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

async function getEnviroments(repo: string, token: string) {
  const octokit = new Octokit({ auth: token });
  const { url, headers } = octokit.request.endpoint(
    `GET /repos/${repo}/environments`,
  );
  const data = await getPaginatedData(url, headers, octokit);
  return data.map(({ name }: { name: string }) => name);
}

async function getPaginatedData(url: string, headers: any, octokit: Octokit) {
  const nextPattern = /(?<=<)([\S]*)(?=>; rel="next")/i;
  let pagesRemaining = true;
  let data: any = [];

  while (pagesRemaining) {
    const response = await octokit.request(`GET ${url}`, {
      per_page: 100,
      headers,
    });

    const parsedData = parseData(response.data);
    console.log(parsedData);
    data = [...data, ...parsedData];

    const linkHeader = response.headers.link;
    const nextLinkMatch =
      typeof linkHeader === 'string' ? linkHeader.match(nextPattern) : null;

    pagesRemaining = Boolean(nextLinkMatch);

    if (nextLinkMatch) {
      url = nextLinkMatch[0];
    }
  }

  return data;
}

function parseData(data: any) {
  // If the data is an array, return that
  if (Array.isArray(data)) {
    return data;
  }

  // Some endpoints respond with 204 No Content instead of empty array
  //   when there is no data. In that case, return an empty array.
  if (!data) {
    return [];
  }

  // Otherwise, the array of items that we want is in an object
  // Delete keys that don't include the array of items
  delete data.incomplete_results;
  delete data.repository_selection;
  delete data.total_count;
  // Pull out the array of items
  const namespaceKey = Object.keys(data)[0];
  data = data[namespaceKey];

  return data;
}
