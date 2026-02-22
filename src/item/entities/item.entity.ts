export class Item {
  item_id: string;
  supplier_id: string;
  name: string;
  description: string;
  price_per_day: number;
  price_per_hour: number;
  status: 'available' | 'rented' | 'maintenance' | 'inactive';
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
}
