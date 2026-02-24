/**
 * Payload sent by the Bidding Microservice when an auction ends.
 * POST <OUR_WEBHOOK_URL>/:tenantId
 */
export interface WebhookPayload {
    event: 'JOB_AUCTION_COMPLETED';
    tenantId: string;
    jobId: string;
    winningBidder: string;
    winningAmount: number;
    totalBidsCount: number;
    jobDetails: Record<string, any>;
    completedAt: number; // unix ms
}
