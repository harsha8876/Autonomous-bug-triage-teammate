const express = require('express');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(execFile);

const app = express();
app.use(express.json());

const LEMMA_API = 'https://api.lemma.work';
const POD_ID = '019f0eef-2601-70ca-b1f4-df7f3fd0f3dd';

let tokenCache = { token: process.env.LEMMA_TOKEN || '', expiresAt: 0 };

async function getBearerToken() {
  if (tokenCache.token && tokenCache.expiresAt > Date.now() + 5 * 60_000) {
    return tokenCache.token;
  }
  try {
    const { stdout } = await execAsync('lemma', ['auth', 'print-token']);
    tokenCache = { token: stdout.trim(), expiresAt: Date.now() + 55 * 60_000 };
    return tokenCache.token;
  } catch {
    return tokenCache.token; // fall back to env token if CLI fails
  }
}

async function lemmaPost(path, body) {
  const token = await getBearerToken();
  const res = await fetch(LEMMA_API + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(res.status + ' ' + path + ': ' + text);
  }
  return res.json();
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/github', async (req, res) => {
  res.sendStatus(200);
  const issue = req.body.issue;
  if (!issue) return;

  const raw_text = issue.title + '\n\n' + (issue.body || '');

  try {
    const fb = await lemmaPost(`/pods/${POD_ID}/datastore/tables/feedback/records`, {
      data: {
        raw_text,
        source: 'github',
        status: 'pending',
      },
    });
    console.log('Created feedback record:', fb.id);

    const wf = await lemmaPost(`/pods/${POD_ID}/workflows/triage/runs`, {
      raw_text,
      source: 'github',
    });
    console.log('Triggered triage workflow:', wf.id);
  } catch (e) {
    console.error('Webhook error:', e.message);
  }
});

app.listen(process.env.PORT || 3001, () => console.log('Webhook server running on :3001'));
