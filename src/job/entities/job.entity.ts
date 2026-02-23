export type JobStatus = 'OPEN' | 'BIDDING' | 'AWARDED' | 'CANCELLED' | 'CLOSED';

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

  // Auction-related fields (populated by bidding service integration)
  auction_job_id?: string; // jobId in the external bidding service
  winning_bidder?: string;
  winning_amount?: number;
  total_bids_count?: number;
  auction_completed_at?: string;

  // GSI2 keys will be added by repository when saving
}
