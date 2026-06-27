// Seed data + canonical triage records for the Operator dashboard.

export const initialFeedback = [
  { id: 'f1', source: 'slack',  time: '12m', status: 'pending',   triageKey: 'checkout',   text: 'Checkout button does nothing on mobile Safari after applying a promo code. Cart total updates but tapping Pay just spins forever.' },
  { id: 'f2', source: 'github', time: '1h',  status: 'triaged',   triageKey: 'darkmode',   text: 'Dark mode toggle resets to light on every page navigation. Have to re-enable it constantly.' },
  { id: 'f3', source: 'manual', time: '3h',  status: 'triaged',   triageKey: 'csv',        text: 'CSV export includes a trailing empty column that breaks our import script.' },
  { id: 'f4', source: 'slack',  time: '5h',  status: 'duplicate', triageKey: 'fileUpload', text: 'App crashes when uploading a file larger than 50MB — no error message, the whole tab freezes.' },
  { id: 'f5', source: 'github', time: '1d',  status: 'triaged',   triageKey: 'search',     text: 'Search results pagination shows page 2 is empty even though there are 40 results.' },
];

export const initialActivity = [
  { id: 'a1', action: 'Triaged “Checkout fails on mobile Safari after promo code”', time: '12m', severity: 'P0' },
  { id: 'a2', action: 'Flagged duplicate “File upload crash” ≈ #142', time: '18m', severity: 'P1' },
  { id: 'a3', action: 'Created issue #318 “Dark mode toggle resets on navigation”', time: '1h', severity: 'P1' },
  { id: 'a4', action: 'Triaged “CSV export trailing empty column”', time: '3h', severity: 'P2' },
  { id: 'a5', action: 'Triaged “Search pagination shows empty page 2”', time: '5h', severity: 'P1' },
  { id: 'a6', action: 'Rejected triage “Typo in footer copyright year”', time: '1d', severity: 'P3' },
  { id: 'a7', action: 'Created issue #311 “Broken avatar images in comments”', time: '2d', severity: 'P3' },
];

export const initialBoard = {
  triage: [
    { id: 'c1', title: 'Search pagination shows an empty page 2', severity: 'P1', component: 'Search', confidence: 81, time: '12m' },
    { id: 'c2', title: 'CSV export includes a trailing empty column', severity: 'P2', component: 'Export', confidence: 88, time: '3h' },
  ],
  approved: [
    { id: 'c3', title: 'Checkout fails on mobile Safari after promo', severity: 'P0', component: 'Payments', confidence: 92, time: '18m' },
    { id: 'c4', title: 'Dark mode toggle resets on navigation', severity: 'P1', component: 'UI', confidence: 76, time: '1h' },
  ],
  inProgress: [
    { id: 'c5', title: 'File upload crash over 50MB', severity: 'P1', component: 'Uploads', confidence: 69, time: '5h' },
    { id: 'c6', title: 'Session expires mid-form, loses input', severity: 'P2', component: 'Auth', confidence: 84, time: '1d' },
  ],
  done: [
    { id: 'c7', title: 'Broken avatar images in comments', severity: 'P3', component: 'Comments', confidence: 73, time: '2d' },
    { id: 'c8', title: 'Tooltip overflows on narrow screens', severity: 'P3', component: 'UI', confidence: 79, time: '3d' },
  ],
};

export const records = {
  checkout: {
    title: 'Checkout fails on mobile Safari after applying promo code',
    severity: 'P0', component: 'Payments', confidence: 92,
    reasoning: 'Payment completion is fully blocked for mobile Safari users who apply a promo code, directly impacting revenue. The indefinite spinner with no error points to an unhandled promise rejection in the Stripe confirmation step, which Safari surfaces differently than Chrome.',
    repro: ['Open the store in mobile Safari (iOS 17+)', 'Add any item to the cart', 'Apply a valid promo code at checkout', 'Tap “Pay” — observe an indefinite spinner with no error'],
    labels: ['payments', 'mobile', 'safari', 'regression'], duplicate: null,
  },
  darkmode: {
    title: 'Dark mode toggle resets to light on navigation',
    severity: 'P1', component: 'UI', confidence: 76,
    reasoning: 'Theme preference is not persisted across route changes, suggesting state is held in component memory rather than localStorage. Affects every dark-mode user but does not block core flows.',
    repro: ['Enable dark mode from settings', 'Navigate to any other page', 'Theme reverts to light'],
    labels: ['ui', 'theme', 'persistence'], duplicate: null,
  },
  csv: {
    title: 'CSV export includes a trailing empty column',
    severity: 'P2', component: 'Export', confidence: 88,
    reasoning: 'A stray delimiter is appended to each row, producing an empty trailing column that breaks downstream imports. Low blast radius but reliably reproducible and data-integrity related.',
    repro: ['Open any report', 'Click Export → CSV', 'Open the file — note the extra empty column after the last field'],
    labels: ['export', 'csv', 'data'], duplicate: null,
  },
  fileUpload: {
    title: 'App crashes when uploading files larger than 50MB',
    severity: 'P1', component: 'Uploads', confidence: 69,
    reasoning: 'Uploads above the multipart threshold fail without surfacing an error, leaving users with a frozen UI. The symptom strongly matches a previously reported S3 multipart issue.',
    repro: ['Open the upload dialog', 'Select a file larger than 50MB', 'Confirm upload — the app freezes with no error message'],
    labels: ['uploads', 's3', 'crash'],
    duplicate: { similarity: 98, issue: 142, issueTitle: 'Large file upload fails silently on S3 multipart' },
  },
  search: {
    title: 'Search pagination shows an empty page 2',
    severity: 'P1', component: 'Search', confidence: 81,
    reasoning: 'The result count and page count disagree: 40 results render but page 2 is empty, indicating an off-by-one in the offset calculation. Users perceive their results as missing.',
    repro: ['Run a search that returns 40+ results', 'Go to page 2', 'Observe an empty results list'],
    labels: ['search', 'pagination'], duplicate: null,
  },
};

export const sevMeta = (l) => ({
  P0: { name: 'Critical', color: '#A0432F', bg: 'rgba(176,81,62,0.16)',  border: 'rgba(176,81,62,0.32)' },
  P1: { name: 'High',     color: '#A8651F', bg: 'rgba(193,118,46,0.16)', border: 'rgba(193,118,46,0.32)' },
  P2: { name: 'Medium',   color: '#8A6E1F', bg: 'rgba(168,150,61,0.22)', border: 'rgba(168,150,61,0.34)' },
  P3: { name: 'Low',      color: '#6B6A52', bg: 'rgba(124,123,102,0.18)', border: 'rgba(124,123,102,0.30)' },
}[l] || { name: 'Low', color: '#6B6A52', bg: 'rgba(124,123,102,0.18)', border: 'rgba(124,123,102,0.30)' });
