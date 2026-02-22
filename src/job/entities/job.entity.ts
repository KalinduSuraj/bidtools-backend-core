export type JobStatus = 'OPEN' | 'CANCELLED' | 'CLOSED';

export interface Job {
  job_id: string;
  contractor_id: string;
  job_description: string;
  required_from: string; // ISO date
  required_to: string; // ISO date
  latitude?: number;
  longitude?: number;
  status: JobStatus;
  created_at: string;
  updated_at?: string;
  // GSI2 keys will be added by repository when saving
}
