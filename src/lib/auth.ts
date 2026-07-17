import { getSecret, setSecret, deleteSecret } from './secrets';

const MOCK_DATA = false;

export async function setGithubToken(token: string): Promise<void> {
  await setSecret('github_pat', token);
}

export async function removeGithubToken(): Promise<void> {
  await deleteSecret('github_pat');
}

export async function getGithubToken(): Promise<string | null> {
  if (MOCK_DATA) return 'mock_token_for_screenshots';
  return getSecret('github_pat');
}

export async function hasGithubToken(): Promise<boolean> {
  if (MOCK_DATA) return true;
  return (await getGithubToken()) !== null;
}
