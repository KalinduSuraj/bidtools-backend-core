/**
 * Inventory Item Entity
 * Represents a piece of construction equipment in the inventory system.
 *
 * DynamoDB Schema:
 * - PK: "INVENTORY"
 * - SK: "ITEM#<inventory_id>"
 * - GSI1PK: "CATEGORY#<category>"
 * - GSI1SK: "ITEM#<inventory_id>"
 * - GSI2PK: "STATUS#<status>"
 * - GSI2SK: "ITEM#<inventory_id>"
 */
export class InventoryItem {
  /** Unique identifier for the inventory item */
  inventory_id: string;

  /** Equipment name (e.g., "Excavator CAT 320") */
  name: string;

  /** Equipment description */
  description: string;

  /** Equipment category (e.g., "EXCAVATOR", "CRANE", "LOADER") */
  category: string;

  /** Equipment model/SKU */
  model: string;

  /** Serial number for tracking */
  serial_number: string;

  /** Total quantity in inventory */
  total_quantity: number;

  /** Currently available quantity (not rented) */
  available_quantity: number;

  /** Currently reserved/rented quantity */
  reserved_quantity: number;

  /** Daily rental rate */
  daily_rate: number;

  /** Hourly rental rate (optional) */
  hourly_rate?: number;

  /** Currency for rates */
  currency: string;

  /**
   * Equipment status:
   * - AVAILABLE: Ready for rental
   * - PARTIALLY_AVAILABLE: Some units available
   * - UNAVAILABLE: All units rented or under maintenance
   * - MAINTENANCE: Under maintenance
   * - RETIRED: No longer in service
   */
  status: InventoryStatus;

  /** Physical location/warehouse */
  location: string;

  /** Supplier ID reference */
  supplier_id?: string;

  /** Condition rating (1-5) */
  condition_rating: number;

  /** Last maintenance date */
  last_maintenance_date?: string;

  /** Next scheduled maintenance date */
  next_maintenance_date?: string;

  /** Equipment specifications (JSON) */
  specifications?: Record<string, any>;

  /** Image URLs */
  images?: string[];

  /** Tags for searchability */
  tags?: string[];

  /** Minimum rental duration in hours */
  min_rental_duration: number;

  /** Maximum rental duration in days */
  max_rental_duration: number;

  /** Created timestamp */
  created_at: string;

  /** Updated timestamp */
  updated_at: string;

  /** Soft delete flag */
  is_deleted: boolean;
}

export type InventoryStatus =
  | 'AVAILABLE'
  | 'PARTIALLY_AVAILABLE'
  | 'UNAVAILABLE'
  | 'MAINTENANCE'
  | 'RETIRED';

/**
 * Inventory Reservation Entity
 * Tracks reservations/bookings for inventory items to prevent double-booking.
 *
 * DynamoDB Schema:
 * - PK: "RESERVATION"
 * - SK: "ITEM#<inventory_id>#<reservation_id>"
 * - GSI1PK: "INVENTORY#<inventory_id>"
 * - GSI1SK: "<start_date>#<end_date>"
 */
export class InventoryReservation {
  /** Unique reservation identifier */
  reservation_id: string;

  /** Reference to inventory item */
  inventory_id: string;

  /** Reference to rental (from Rental module) */
  rental_id?: string;

  /** User who made the reservation */
  user_id: string;

  /** Quantity reserved */
  quantity: number;

  /** Reservation start date (ISO string) */
  start_date: string;

  /** Reservation end date (ISO string) */
  end_date: string;

  /**
   * Reservation status:
   * - PENDING: Awaiting confirmation
   * - CONFIRMED: Reservation confirmed
   * - ACTIVE: Currently in use
   * - COMPLETED: Rental completed, equipment returned
   * - CANCELLED: Reservation cancelled
   */
  status: ReservationStatus;

  /** Notes for the reservation */
  notes?: string;

  /** Created timestamp */
  created_at: string;

  /** Updated timestamp */
  updated_at: string;
}

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';
