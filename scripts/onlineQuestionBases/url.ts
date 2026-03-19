import { OnlineQuestionBaseIndexItem, OnlineQuestionBaseRepositoryConfig } from "./types";
import { isHttpOrHttpsUrl } from "../utils/url";

function isGithubRepoUrl(url: string) {
  return /^https?:\/\/github\.com\/[^/]+\/[^/]+(?:\.git|\/)?$/i.test(url.trim());
}

function joinUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}${normalizedPath}`;
}

export function deriveRepositoryName(repoUrl: string) {
  const githubRepoMatch = repoUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/)?$/i);
  if (githubRepoMatch) {
    return `${githubRepoMatch[1]}/${githubRepoMatch[2]}`;
  }
  try {
    const parsed = new URL(repoUrl);
    return parsed.host;
  } catch {
    return undefined;
  }
}

function buildFileBasePrefix(repo: OnlineQuestionBaseRepositoryConfig) {
  const repoUrl = repo.repoUrl.trim();
  if (repoUrl.toLowerCase().endsWith(".json")) {
    const lastSlashIndex = repoUrl.lastIndexOf("/");
    if (lastSlashIndex > "https://".length) {
      return repoUrl.slice(0, lastSlashIndex + 1);
    }
    return repoUrl;
  }

  if (!isGithubRepoUrl(repoUrl)) {
    return repoUrl.endsWith("/") ? repoUrl : `${repoUrl}/`;
  }

  const githubRepoMatch = repo.repoUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/)?$/i);
  if (!githubRepoMatch) {
    return repoUrl.endsWith("/") ? repoUrl : `${repoUrl}/`;
  }

  const owner = githubRepoMatch[1];
  const repository = githubRepoMatch[2];
  const branch = repo.branch.trim() || "main";
  return `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/`;
}

export function buildIndexUrl(repo: OnlineQuestionBaseRepositoryConfig) {
  const repoUrl = repo.repoUrl.trim();
  if (repoUrl.toLowerCase().endsWith(".json")) {
    return repoUrl;
  }

  const basePrefix = buildFileBasePrefix(repo);
  return joinUrl(basePrefix, repo.indexPath);
}

export function buildQuestionBaseFileUrl(repo: OnlineQuestionBaseRepositoryConfig, item: OnlineQuestionBaseIndexItem) {
  if (item.downloadUrl && isHttpOrHttpsUrl(item.downloadUrl)) {
    return item.downloadUrl;
  }

  if (!item.filePath) {
    return null;
  }

  const basePrefix = buildFileBasePrefix(repo);
  return joinUrl(basePrefix, item.filePath);
}
