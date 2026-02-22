export class Payment {
  payment_id: string;
  rental_id: number;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transaction_reference?: string;
  created_at: Date;
  is_deleted: boolean;
}
