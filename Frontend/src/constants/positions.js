// Central list of candidate positions used across the app.
export const POSITIONS = [
  'Vice President',
  'Joint Secretary',
  'Assistant Technical Coordinator',
  'Joint Treasurer',
  'Joint Sports Secretary',
  'Assistant Cultural Co-ordinator',
  'Assistant Magazine Editor (Male)',
  'Assistant Magazine Editor (Female)',
  'Assistant Event Modulator',
  'Assistant Social Media Co-ordinator'
];

export const positionOptions = POSITIONS.map(p => ({ value: p, label: p.replace(/\b\w/g, l => l.toUpperCase()) }));
