import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;

  console.log(`Checking PR 2 on ${owner}/${repo}...`);
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/2`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'MangaloreBusRoutesApp',
    },
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('PR state:', data.state);
  console.log('PR merged_at:', data.merged_at);
  console.log('PR merged:', data.merged);
}

check().catch(console.error);

