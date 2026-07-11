import { getGithubToken } from './auth';
import { customFetch } from './api';
import { mergeTrafficData } from './storage';

function getAuthHeaders() {
  const token = getGithubToken();
  if (!token) {
    throw new Error('No GitHub token found');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export async function getUser() {
  const headers = getAuthHeaders();
  const res = await customFetch('https://api.github.com/user', { headers });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function getRepos() {
  const headers = getAuthHeaders();
  let allRepos: any[] = [];
  let page = 1;
  let hasMore = true;

  // Fetch all repos with pagination (up to 5 pages or until empty to avoid hanging forever)
  while (hasMore && page <= 10) {
    const res = await customFetch(`https://api.github.com/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner`, { headers });
    if (!res.ok) throw new Error('Failed to fetch repositories');
    
    const data = await res.json();
    if (data.length === 0) {
      hasMore = false;
    } else {
      allRepos = [...allRepos, ...data];
      page++;
    }
  }
  
  return allRepos;
}

export async function getRepoTrafficViews(owner: string, repo: string) {
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/traffic/views`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.views) {
    data.views = mergeTrafficData(`${owner}/${repo}`, 'views', data.views);
  }
  return data;
}

export async function getRepoTrafficClones(owner: string, repo: string) {
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/traffic/clones`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.clones) {
    data.clones = mergeTrafficData(`${owner}/${repo}`, 'clones', data.clones);
  }
  return data;
}

export async function getRepoTrafficPaths(owner: string, repo: string) {
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/traffic/popular/paths`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function getRepoTrafficReferrers(owner: string, repo: string) {
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/traffic/popular/referrers`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function getRepoLanguages(owner: string, repo: string) {
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
  if (!res.ok) return {};
  return res.json();
}

export async function getRepoPulls(owner: string, repo: string) {
  const headers = getAuthHeaders();
  // Fetch up to 100 recent PRs
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function getRepoIssues(owner: string, repo: string) {
  const headers = getAuthHeaders();
  // Fetch up to 100 recent issues
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function getRepoAlerts(owner: string, repo: string) {
  const headers = getAuthHeaders();
  try {
    const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/dependabot/alerts`, { headers });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getRepoMentions(repoName: string) {
  const headers = getAuthHeaders();
  try {
    const res = await customFetch(`https://api.github.com/search/issues?q=${encodeURIComponent(repoName)}+in:body`, { headers });
    if (!res.ok) return { items: [] };
    return res.json();
  } catch {
    return { items: [] };
  }
}
