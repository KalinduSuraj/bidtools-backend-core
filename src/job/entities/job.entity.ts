export interface Job {
  job_id: string;
  contractor_id: string;
  job_description: string;
  required_from: string; // ISO datetime
  required_to: string; // ISO datetime
  latitude?: number;
  longitude?: number;
  // status values like 'OPEN', 'CANCELLED', 'CLOSED' etc.
  status?: string;
  created_at: string; // ISO datetime
  updated_at?: string; // ISO datetime
  // Additional optional metadata may exist (e.g. approved_at, supplier_id when reserved)
  [key: string]: any;
}
