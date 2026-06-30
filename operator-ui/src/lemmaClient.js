import { LemmaClient } from 'lemma-sdk';

export const lemmaClient = new LemmaClient({
  podId: import.meta.env.VITE_LEMMA_POD_ID ?? '019f0eef-2601-70ca-b1f4-df7f3fd0f3dd',
  apiUrl: 'https://api.lemma.work',
  authUrl: 'https://lemma.work/auth',
});
