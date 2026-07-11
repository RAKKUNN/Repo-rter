const MOCK_DATA = false;

export function setGithubToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('github_pat', token);
  }
}

export function removeGithubToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('github_pat');
  }
}

export function getGithubToken(): string | null {
  if (MOCK_DATA) return 'mock_token_for_screenshots';
  if (typeof window !== 'undefined') {
    return localStorage.getItem('github_pat');
  }
  return null;
}

export function hasGithubToken(): boolean {
  if (MOCK_DATA) return true;
  return !!getGithubToken();
}
