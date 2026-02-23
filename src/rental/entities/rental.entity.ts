export interface Rental {
  PK: string; // RENTAL#<rental_id>
  SK: string; // METADATA
  GSI3PK: string; // CONTRACTOR#<contractor_id>
  GSI3SK: string; // RENTAL#<rental_id>
  GSI4PK: string; // SUPPLIER#<supplier_id>
  GSI4SK: string; // RENTAL#<rental_id>
  rental_id: string;
  job_id: string;
  contractor_id: string;
  supplier_id: string;
  bid_id: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  total_amount: number;
  status: string;
  payment_status: string;
  [key: string]: any;
}
