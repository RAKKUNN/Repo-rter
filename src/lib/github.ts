import { getGithubToken } from './auth';
import { customFetch } from './api';
import { mergeTrafficData } from './storage';

const MOCK_DATA = false;

function getAuthHeaders() {
  if (MOCK_DATA) return {};
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
  if (MOCK_DATA) {
    return {
      login: 'pixel-ninja',
      name: 'Pixel Ninja',
      avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
    };
  }
  const headers = getAuthHeaders();
  const res = await customFetch('https://api.github.com/user', { headers });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function getRepos() {
  if (MOCK_DATA) {
    return [
      { id: 1, name: 'awesome-project', owner: { login: 'pixel-ninja' }, stargazers_count: 24500, forks_count: 3200, open_issues_count: 42, description: 'The most awesome pixel art project' },
      { id: 2, name: 'next-dashboard', owner: { login: 'pixel-ninja' }, stargazers_count: 18200, forks_count: 1500, open_issues_count: 15, description: 'Next.js dashboard template' },
      { id: 3, name: 'retro-tools', owner: { login: 'pixel-ninja' }, stargazers_count: 9400, forks_count: 850, open_issues_count: 8, description: 'CLI tools with retro aesthetics' },
      { id: 4, name: 'rust-core', owner: { login: 'pixel-ninja' }, stargazers_count: 5300, forks_count: 420, open_issues_count: 3, description: 'High performance core components' },
      { id: 5, name: 'pixel-ui', owner: { login: 'pixel-ninja' }, stargazers_count: 1200, forks_count: 150, open_issues_count: 1, description: 'Neo-brutalist UI component library' },
    ];
  }
  const headers = getAuthHeaders();
  let allRepos: any[] = [];
  let page = 1;
  let hasMore = true;

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

function generateMockTimeline(base: number, volatility: number) {
  const views = [];
  const now = new Date();
  for (let i = 14; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const count = Math.floor(base + Math.random() * volatility);
    views.push({
      timestamp: d.toISOString(),
      count: count,
      uniques: Math.floor(count * 0.6)
    });
  }
  return views;
}

export async function getRepoTrafficViews(owner: string, repo: string) {
  if (MOCK_DATA) {
    const base = repo === 'awesome-project' ? 8000 : repo === 'next-dashboard' ? 5000 : 2000;
    return { views: generateMockTimeline(base, base / 2) };
  }
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/traffic/views`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.views) {
    data.views = await mergeTrafficData(`${owner}/${repo}`, 'views', data.views);
  }
  return data;
}

export async function getRepoTrafficClones(owner: string, repo: string) {
  if (MOCK_DATA) {
    const base = repo === 'awesome-project' ? 2000 : repo === 'next-dashboard' ? 1000 : 500;
    return { clones: generateMockTimeline(base, base / 3) };
  }
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/traffic/clones`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.clones) {
    data.clones = await mergeTrafficData(`${owner}/${repo}`, 'clones', data.clones);
  }
  return data;
}

export async function getRepoTrafficPaths(owner: string, repo: string) {
  if (MOCK_DATA) {
    return [
      { path: '/github/repo', title: 'Repository Home', count: 45000, uniques: 28000 },
      { path: '/github/repo/issues', title: 'Issues', count: 12000, uniques: 8000 },
      { path: '/github/repo/pulls', title: 'Pull Requests', count: 8500, uniques: 4000 },
    ];
  }
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/traffic/popular/paths`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function getRepoTrafficReferrers(owner: string, repo: string) {
  if (MOCK_DATA) {
    return [
      { referrer: 'google.com', count: 85000, uniques: 50000 },
      { referrer: 'reddit.com', count: 42000, uniques: 38000 },
      { referrer: 'twitter.com', count: 28000, uniques: 25000 },
      { referrer: 'ycombinator.com', count: 15000, uniques: 14000 },
    ];
  }
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/traffic/popular/referrers`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function getRepoLanguages(owner: string, repo: string) {
  if (MOCK_DATA) {
    return {
      TypeScript: 85000,
      Rust: 42000,
      CSS: 15000,
      HTML: 5000
    };
  }
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
  if (!res.ok) return {};
  return res.json();
}

export async function getRepoPulls(owner: string, repo: string) {
  if (MOCK_DATA) {
    return [
      { state: 'open' }, { state: 'open' }, { state: 'closed' }, { state: 'closed' }
    ];
  }
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function getRepoIssues(owner: string, repo: string) {
  if (MOCK_DATA) return [];
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function getRepoAlerts(owner: string, repo: string) {
  if (MOCK_DATA) {
    if (repo === 'awesome-project') return [{ state: 'open' }, { state: 'open' }];
    if (repo === 'next-dashboard') return [{ state: 'open' }];
    return [];
  }
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
  if (MOCK_DATA) {
    return {
      items: [
        { id: 1, title: 'Check out this awesome new tool', html_url: '#', user: { login: 'dev_user', avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4' }, created_at: new Date().toISOString() },
        { id: 2, title: 'Neo-brutalism in 2026', html_url: '#', user: { login: 'design_guru', avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4' }, created_at: new Date().toISOString() }
      ]
    };
  }
  const headers = getAuthHeaders();
  try {
    const res = await customFetch(`https://api.github.com/search/issues?q=${encodeURIComponent(repoName)}+in:body`, { headers });
    if (!res.ok) return { items: [] };
    return res.json();
  } catch {
    return { items: [] };
  }
}

export async function getRepoReleases(owner: string, repo: string) {
  if (MOCK_DATA) {
    return [
      {
        id: 1,
        name: 'v1.0.0',
        tag_name: 'v1.0.0',
        published_at: new Date().toISOString(),
        assets: [
          { id: 101, name: 'app-setup.exe', download_count: 1420 },
          { id: 102, name: 'app-mac.dmg', download_count: 850 },
          { id: 103, name: 'app-linux.deb', download_count: 320 }
        ]
      },
      {
        id: 2,
        name: 'v0.9.0',
        tag_name: 'v0.9.0',
        published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        assets: [
          { id: 201, name: 'app-setup.exe', download_count: 890 },
          { id: 202, name: 'app-mac.dmg', download_count: 510 }
        ]
      }
    ];
  }
  const headers = getAuthHeaders();
  const res = await customFetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`, { headers });
  if (!res.ok) return [];
  return res.json();
}
