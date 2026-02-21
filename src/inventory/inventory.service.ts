import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { InventoryRepository } from './inventory.repository';
import {
  InventoryItem,
  InventoryReservation,
  InventoryStatus,
  ReservationStatus,
} from './entities/inventory-item.entity';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  CreateReservationDto,
  UpdateReservationDto,
  CheckAvailabilityDto,
} from './dto';

/**
 * Inventory Service
 * Handles all business logic for inventory management including:
 * - Equipment quantity management
 * - Availability tracking
 * - Double-booking prevention
 * - Rental start/end updates
 */
@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  // ==================== INVENTORY ITEMS ====================

  /**
   * Get all inventory items
   */
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return this.inventoryRepository.getAllInventoryItems();
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItemById(inventoryId: string): Promise<InventoryItem> {
    const item =
      await this.inventoryRepository.getInventoryItemById(inventoryId);
    if (!item) {
      throw new NotFoundException(
        `Inventory item with ID "${inventoryId}" not found`,
      );
    }
    return item;
  }

  /**
   * Get inventory items by category
   */
  async getInventoryItemsByCategory(
    category: string,
  ): Promise<InventoryItem[]> {
    return this.inventoryRepository.getInventoryItemsByCategory(
      category.toUpperCase(),
    );
  }

  /**
   * Get inventory items by status
   */
  async getInventoryItemsByStatus(
    status: InventoryStatus,
  ): Promise<InventoryItem[]> {
    return this.inventoryRepository.getInventoryItemsByStatus(status);
  }

  /**
   * Get all available inventory items
   */
  async getAvailableInventoryItems(): Promise<InventoryItem[]> {
    return this.inventoryRepository.getAvailableInventoryItems();
  }

  /**
   * Search inventory items
   */
  async searchInventoryItems(searchTerm: string): Promise<InventoryItem[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException(
        'Search term must be at least 2 characters',
      );
    }
    return this.inventoryRepository.searchInventoryItems(searchTerm.trim());
  }

  /**
   * Create a new inventory item
   */
  async createInventoryItem(
    createDto: CreateInventoryItemDto,
  ): Promise<InventoryItem> {
    const inventoryId = uuid();
    const now = new Date().toISOString();

    const newItem: InventoryItem = {
      inventory_id: inventoryId,
      name: createDto.name,
      description: createDto.description,
      category: createDto.category.toUpperCase(),
      model: createDto.model,
      serial_number: createDto.serial_number,
      total_quantity: createDto.total_quantity,
      available_quantity: createDto.total_quantity, // Initially all available
      reserved_quantity: 0,
      daily_rate: createDto.daily_rate,
      hourly_rate: createDto.hourly_rate,
      currency: createDto.currency || 'LKR',
      status: 'AVAILABLE',
      location: createDto.location,
      supplier_id: createDto.supplier_id,
      condition_rating: createDto.condition_rating || 5,
      next_maintenance_date: createDto.next_maintenance_date,
      specifications: createDto.specifications,
      images: createDto.images || [],
      tags: createDto.tags || [],
      min_rental_duration: createDto.min_rental_duration || 1,
      max_rental_duration: createDto.max_rental_duration || 365,
      created_at: now,
      updated_at: now,
      is_deleted: false,
    };

    await this.inventoryRepository.saveInventoryItem(newItem);
    return newItem;
  }

  /**
   * Update an inventory item
   */
  async updateInventoryItem(
    inventoryId: string,
    updateDto: UpdateInventoryItemDto,
  ): Promise<InventoryItem> {
    const existingItem = await this.getInventoryItemById(inventoryId);

    // Handle quantity changes
    if (updateDto.total_quantity !== undefined) {
      const quantityDiff =
        updateDto.total_quantity - existingItem.total_quantity;
      const newAvailable = existingItem.available_quantity + quantityDiff;

      if (newAvailable < 0) {
        throw new BadRequestException(
          `Cannot reduce total quantity below reserved amount. Currently ${existingItem.reserved_quantity} units are reserved.`,
        );
      }

      existingItem.total_quantity = updateDto.total_quantity;
      existingItem.available_quantity = newAvailable;
    }

    // Update status based on availability
    if (updateDto.status) {
      existingItem.status = updateDto.status as InventoryStatus;
    } else {
      existingItem.status = this.calculateStatus(
        existingItem.available_quantity,
        existingItem.total_quantity,
      );
    }

    const updatedItem: InventoryItem = {
      ...existingItem,
      ...updateDto,
      category: updateDto.category?.toUpperCase() || existingItem.category,
      status: existingItem.status,
      updated_at: new Date().toISOString(),
    };

    await this.inventoryRepository.updateInventoryItem(updatedItem);
    return updatedItem;
  }

  /**
   * Delete an inventory item (soft delete)
   */
  async deleteInventoryItem(inventoryId: string): Promise<void> {
    // Verify item exists
    await this.getInventoryItemById(inventoryId);

    // Check for active reservations
    const reservations =
      await this.inventoryRepository.getActiveReservations(inventoryId);
    if (reservations.length > 0) {
      throw new ConflictException(
        `Cannot delete inventory item with ${reservations.length} active reservation(s)`,
      );
    }

    await this.inventoryRepository.deleteInventoryItem(inventoryId);
  }

  /**
   * Update inventory item status to maintenance
   */
  async setMaintenanceStatus(
    inventoryId: string,
    maintenanceDate: string,
  ): Promise<InventoryItem> {
    const item = await this.getInventoryItemById(inventoryId);

    if (item.reserved_quantity > 0) {
      throw new ConflictException(
        `Cannot set to maintenance while ${item.reserved_quantity} units are reserved`,
      );
    }

    item.status = 'MAINTENANCE';
    item.last_maintenance_date = maintenanceDate;
    item.updated_at = new Date().toISOString();

    await this.inventoryRepository.updateInventoryItem(item);
    return item;
  }

  // ==================== RESERVATIONS ====================

  /**
   * Check availability for a date range
   * Returns available quantity for the specified period
   */
  async checkAvailability(
    inventoryId: string,
    checkDto: CheckAvailabilityDto,
  ): Promise<{
    available: boolean;
    available_quantity: number;
    requested_quantity: number;
    conflicts: InventoryReservation[];
  }> {
    const item = await this.getInventoryItemById(inventoryId);

    if (item.status === 'MAINTENANCE' || item.status === 'RETIRED') {
      return {
        available: false,
        available_quantity: 0,
        requested_quantity: checkDto.quantity,
        conflicts: [],
      };
    }

    // Validate dates
    const startDate = new Date(checkDto.start_date);
    const endDate = new Date(checkDto.end_date);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Get overlapping reservations
    const conflicts = await this.getOverlappingReservations(
      inventoryId,
      checkDto.start_date,
      checkDto.end_date,
    );

    // Calculate maximum reserved quantity during the period
    const maxReservedInPeriod = this.calculateMaxReservedQuantity(conflicts);

    const availableInPeriod = item.total_quantity - maxReservedInPeriod;

    return {
      available: availableInPeriod >= checkDto.quantity,
      available_quantity: availableInPeriod,
      requested_quantity: checkDto.quantity,
      conflicts: conflicts,
    };
  }

  /**
   * Create a reservation (book equipment)
   * This is the main method to prevent double-booking
   */
  async createReservation(
    createDto: CreateReservationDto,
  ): Promise<InventoryReservation> {
    const item = await this.getInventoryItemById(createDto.inventory_id);

    // Validate dates
    const startDate = new Date(createDto.start_date);
    const endDate = new Date(createDto.end_date);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check rental duration constraints
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (durationDays < item.min_rental_duration / 24) {
      throw new BadRequestException(
        `Minimum rental duration is ${item.min_rental_duration} hours`,
      );
    }

    if (durationDays > item.max_rental_duration) {
      throw new BadRequestException(
        `Maximum rental duration is ${item.max_rental_duration} days`,
      );
    }

    // Check availability (prevents double-booking)
    const availability = await this.checkAvailability(createDto.inventory_id, {
      start_date: createDto.start_date,
      end_date: createDto.end_date,
      quantity: createDto.quantity,
    });

    if (!availability.available) {
      throw new ConflictException(
        `Only ${availability.available_quantity} units available for the requested period. Requested: ${createDto.quantity}`,
      );
    }

    // Create reservation
    const reservationId = uuid();
    const now = new Date().toISOString();

    const reservation: InventoryReservation = {
      reservation_id: reservationId,
      inventory_id: createDto.inventory_id,
      rental_id: createDto.rental_id,
      user_id: createDto.user_id,
      quantity: createDto.quantity,
      start_date: createDto.start_date,
      end_date: createDto.end_date,
      status: 'PENDING',
      notes: createDto.notes,
      created_at: now,
      updated_at: now,
    };

    await this.inventoryRepository.saveReservation(reservation);

    // Update inventory quantities
    await this.updateInventoryOnReservation(createDto.inventory_id);

    return reservation;
  }

  /**
   * Get reservation by ID
   */
  async getReservationById(
    inventoryId: string,
    reservationId: string,
  ): Promise<InventoryReservation> {
    const reservation = await this.inventoryRepository.getReservationById(
      inventoryId,
      reservationId,
    );

    if (!reservation) {
      throw new NotFoundException(
        `Reservation with ID "${reservationId}" not found`,
      );
    }

    return reservation;
  }

  /**
   * Get all reservations for an inventory item
   */
  async getReservationsByInventoryId(
    inventoryId: string,
  ): Promise<InventoryReservation[]> {
    // Verify inventory exists
    await this.getInventoryItemById(inventoryId);
    return this.inventoryRepository.getReservationsByInventoryId(inventoryId);
  }

  /**
   * Confirm a reservation
   */
  async confirmReservation(
    inventoryId: string,
    reservationId: string,
  ): Promise<InventoryReservation> {
    const reservation = await this.getReservationById(
      inventoryId,
      reservationId,
    );

    if (reservation.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot confirm reservation with status "${reservation.status}"`,
      );
    }

    reservation.status = 'CONFIRMED';
    reservation.updated_at = new Date().toISOString();

    await this.inventoryRepository.updateReservation(reservation);
    return reservation;
  }

  /**
   * Start rental (activate reservation)
   * Called when equipment is picked up
   */
  async startRental(
    inventoryId: string,
    reservationId: string,
  ): Promise<InventoryReservation> {
    const reservation = await this.getReservationById(
      inventoryId,
      reservationId,
    );

    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException(
        `Cannot start rental for reservation with status "${reservation.status}". Must be CONFIRMED first.`,
      );
    }

    reservation.status = 'ACTIVE';
    reservation.updated_at = new Date().toISOString();

    await this.inventoryRepository.updateReservation(reservation);

    // Update inventory quantities
    await this.updateInventoryOnReservation(inventoryId);

    return reservation;
  }

  /**
   * End rental (complete reservation)
   * Called when equipment is returned
   */
  async endRental(
    inventoryId: string,
    reservationId: string,
  ): Promise<InventoryReservation> {
    const reservation = await this.getReservationById(
      inventoryId,
      reservationId,
    );

    if (reservation.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot end rental for reservation with status "${reservation.status}". Must be ACTIVE.`,
      );
    }

    reservation.status = 'COMPLETED';
    reservation.updated_at = new Date().toISOString();

    await this.inventoryRepository.updateReservation(reservation);

    // Update inventory quantities - equipment returned
    await this.updateInventoryOnReservation(inventoryId);

    return reservation;
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(
    inventoryId: string,
    reservationId: string,
  ): Promise<InventoryReservation> {
    const reservation = await this.getReservationById(
      inventoryId,
      reservationId,
    );

    if (
      reservation.status === 'COMPLETED' ||
      reservation.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        `Cannot cancel reservation with status "${reservation.status}"`,
      );
    }

    reservation.status = 'CANCELLED';
    reservation.updated_at = new Date().toISOString();

    await this.inventoryRepository.updateReservation(reservation);

    // Update inventory quantities
    await this.updateInventoryOnReservation(inventoryId);

    return reservation;
  }

  /**
   * Update a reservation
   */
  async updateReservation(
    inventoryId: string,
    reservationId: string,
    updateDto: UpdateReservationDto,
  ): Promise<InventoryReservation> {
    const reservation = await this.getReservationById(
      inventoryId,
      reservationId,
    );

    // If dates or quantity are being changed, re-check availability
    if (updateDto.start_date || updateDto.end_date || updateDto.quantity) {
      const newStartDate = updateDto.start_date || reservation.start_date;
      const newEndDate = updateDto.end_date || reservation.end_date;
      const newQuantity = updateDto.quantity || reservation.quantity;

      // Temporarily exclude this reservation from conflict checking
      const conflicts = await this.getOverlappingReservations(
        inventoryId,
        newStartDate,
        newEndDate,
        reservationId, // Exclude current reservation
      );

      const item = await this.getInventoryItemById(inventoryId);
      const maxReserved = this.calculateMaxReservedQuantity(conflicts);

      if (item.total_quantity - maxReserved < newQuantity) {
        throw new ConflictException(
          'Requested changes conflict with existing reservations',
        );
      }
    }

    const updatedReservation: InventoryReservation = {
      ...reservation,
      ...updateDto,
      status: (updateDto.status as ReservationStatus) || reservation.status,
      updated_at: new Date().toISOString(),
    };

    await this.inventoryRepository.updateReservation(updatedReservation);

    // Update inventory quantities
    await this.updateInventoryOnReservation(inventoryId);

    return updatedReservation;
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Calculate inventory status based on availability
   */
  private calculateStatus(
    availableQuantity: number,
    totalQuantity: number,
  ): InventoryStatus {
    if (availableQuantity === 0) {
      return 'UNAVAILABLE';
    }
    if (availableQuantity === totalQuantity) {
      return 'AVAILABLE';
    }
    return 'PARTIALLY_AVAILABLE';
  }

  /**
   * Get overlapping reservations for a date range
   */
  private async getOverlappingReservations(
    inventoryId: string,
    startDate: string,
    endDate: string,
    excludeReservationId?: string,
  ): Promise<InventoryReservation[]> {
    const reservations =
      await this.inventoryRepository.getActiveReservations(inventoryId);

    return reservations.filter((res) => {
      // Exclude the specified reservation (for update scenarios)
      if (excludeReservationId && res.reservation_id === excludeReservationId) {
        return false;
      }

      // Check for date overlap
      const resStart = new Date(res.start_date);
      const resEnd = new Date(res.end_date);
      const checkStart = new Date(startDate);
      const checkEnd = new Date(endDate);

      // Overlap exists if: start < otherEnd AND end > otherStart
      return checkStart < resEnd && checkEnd > resStart;
    });
  }

  /**
   * Calculate maximum reserved quantity during a period
   * This handles overlapping reservations correctly
   */
  private calculateMaxReservedQuantity(
    reservations: InventoryReservation[],
  ): number {
    if (reservations.length === 0) {
      return 0;
    }

    // Simple approach: sum all overlapping reservation quantities
    // For a more sophisticated approach, you'd check each time point
    return reservations.reduce((sum, res) => sum + res.quantity, 0);
  }

  /**
   * Update inventory quantities based on current reservations
   */
  private async updateInventoryOnReservation(
    inventoryId: string,
  ): Promise<void> {
    const item =
      await this.inventoryRepository.getInventoryItemById(inventoryId);
    if (!item) return;

    // Get all active/confirmed reservations
    const activeReservations =
      await this.inventoryRepository.getActiveReservations(inventoryId);

    // Calculate currently reserved quantity
    const reservedQuantity = activeReservations.reduce(
      (sum, res) => sum + res.quantity,
      0,
    );

    const availableQuantity = item.total_quantity - reservedQuantity;
    const status = this.calculateStatus(availableQuantity, item.total_quantity);

    await this.inventoryRepository.updateInventoryQuantities(
      inventoryId,
      availableQuantity,
      reservedQuantity,
      status,
    );
  }
}
