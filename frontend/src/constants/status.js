export const STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'];

export const STATUS_LABELS = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};
// Actions offered in the UI for each status (the backend enforces the same rules)
export const STATUS_ACTIONS = {
  NEW: [{ to: 'IN_PROGRESS', label: 'Start working' }],
  IN_PROGRESS: [
    { to: 'RESOLVED', label: 'Mark as resolved' },
    { to: 'NEW', label: 'Move back to New' },
  ],
  RESOLVED: [{ to: 'IN_PROGRESS', label: 'Reopen' }],
};