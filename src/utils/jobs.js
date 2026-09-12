// Helpers for the merged jobs list (placement drives + company openings).
// Mirrors the web app (jobopenings/components/JobCard.js & mainComp.js).

// The web shows a "Created by TPO" badge when `isAssignedJob === false`.
// So: isAssignedJob === false => TPO placement drive
//     isAssignedJob === true  => company opening
export function isPlacementDrive(job = {}) {
  return job.isAssignedJob === false;
}

// Consider a job "new" when it was posted within the last 24h (web uses 1 day).
export function isNewJob(job = {}, windowDays = 1) {
  const t = typeof job.createdAt === 'number' ? job.createdAt : Date.parse(job.createdAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= windowDays * 86400000;
}

// Resolve the jobId of an entry in student.appliedJobs (shapes vary).
export function appliedJobId(entry) {
  if (!entry) return null;
  return (
    entry?.jobDetails?._id ||
    entry?._id ||
    entry?.jobId ||
    entry?.id ||
    (typeof entry === 'string' ? entry : null)
  );
}

// Build the "Applied Jobs" list by resolving each appliedJobs entry against the
// full jobs list (falling back to embedded jobDetails), attaching the status.
export function buildAppliedJobs(appliedJobs = [], allJobs = []) {
  return (appliedJobs || [])
    .map((aj) => {
      const jobId = appliedJobId(aj);
      if (!jobId) return null;
      const details = allJobs.find((j) => String(j._id) === String(jobId)) || aj.jobDetails;
      if (!details) return { _id: jobId, jobTitle: 'Applied job', applicationStatus: aj.status || 'applied' };
      return { ...details, applicationStatus: aj.status || aj.applicationStatus || 'applied' };
    })
    .filter(Boolean);
}

// Normalise an application status into a label + chip variant.
export function applicationStatusOf(job = {}) {
  const raw = String(
    job.applicationStatus || job.applicationState || job.applyStatus || job.status || 'pending'
  ).toLowerCase();

  if (raw.includes('select') || raw.includes('accept') || raw.includes('offer') || raw.includes('shortlist')) {
    return { key: 'accepted', label: 'Accepted', variant: 'green' };
  }
  if (raw.includes('reject') || raw.includes('decline') || raw.includes('withdraw')) {
    return { key: 'rejected', label: 'Rejected', variant: 'red' };
  }
  if (raw.includes('interview')) {
    return { key: 'interview', label: 'Interview', variant: 'default' };
  }
  if (raw === 'applied') {
    return { key: 'applied', label: 'Applied', variant: 'default' };
  }
  return { key: 'pending', label: 'Pending', variant: 'yellow' };
}

export default { isPlacementDrive, isNewJob, appliedJobId, buildAppliedJobs, applicationStatusOf };