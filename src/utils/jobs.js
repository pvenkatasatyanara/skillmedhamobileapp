// Helpers for the merged jobs list (placement drives + company openings).

// A job is treated as a TPO placement drive when it is linked to a placement
// profile or has a placement coordinator; otherwise it is a company opening.
export function isPlacementDrive(job = {}) {
  if (job.isPlacementDrive === true || job.type === 'drive') return true;
  if (job.type === 'company') return false;
  return !!(job.profileId || job.coordinatorName || job.coordinatorEmail);
}

// Consider a job "new" when it was created within the last 7 days.
export function isNewJob(job = {}, windowDays = 7) {
  const t = typeof job.createdAt === 'number' ? job.createdAt : Date.parse(job.createdAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= windowDays * 86400000;
}

// Normalise the application status of an applied job into a label + chip variant.
// Falls back to "Pending" while a decision is awaited.
export function applicationStatusOf(job = {}) {
  const raw = String(
    job.applicationStatus || job.applicationState || job.applyStatus || 'pending'
  ).toLowerCase();

  if (raw.includes('accept') || raw.includes('select') || raw.includes('shortlist') || raw.includes('offer')) {
    return { key: 'accepted', label: 'Accepted', variant: 'green' };
  }
  if (raw.includes('reject') || raw.includes('decline')) {
    return { key: 'rejected', label: 'Rejected', variant: 'red' };
  }
  return { key: 'pending', label: 'Pending', variant: 'yellow' };
}

export default { isPlacementDrive, isNewJob, applicationStatusOf };