const express = require('express');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

const POD_ID = '019f0891-5981-774f-967b-18209c907826';

// Wrap a string for safe embedding inside single-quoted shell arguments
const sq = (str) => "'" + String(str).replace(/'/g, "'\\''") + "'";

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) { reject(new Error(stderr || err.message)); return; }
      resolve(stdout.trim());
    });
  });
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/github', async (req, res) => {
  res.sendStatus(200);
  const issue = req.body.issue;
  if (!issue) return;

  const raw_text = issue.title + '\n\n' + (issue.body || '');

  try {
    const fbData = sq(JSON.stringify({ raw_text, source: 'github', status: 'pending' }));
    const fbOut = await run(
      `lemma record create feedback --pod ${POD_ID} --data ${fbData}`
    );
    console.log('Created feedback record:', fbOut);

    const wfData = sq(JSON.stringify({ raw_text }));
    const wfOut = await run(
      `lemma workflow run triage --pod ${POD_ID} --data ${wfData}`
    );
    console.log('Triggered triage workflow:', wfOut);
  } catch (e) {
    console.error('Webhook error:', e.message);
  }
});

app.listen(process.env.PORT || 3001, () => console.log('Webhook server running on :3001'));
