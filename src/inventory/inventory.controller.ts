import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  CreateReservationDto,
  UpdateReservationDto,
  CheckAvailabilityDto,
} from './dto';
import type { InventoryStatus } from './entities/inventory-item.entity';

/**
 * Inventory Controller
 * RESTful API endpoints for inventory management
 *
 * Base path: /inventory
 */
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==================== INVENTORY ITEMS ====================

  /**
   * GET /inventory
   * Get all inventory items
   *
   * Query params:
   * - category: Filter by category (optional)
   * - status: Filter by status (optional)
   * - available: If true, only return available items (optional)
   */
  @Get()
  async getAllInventoryItems(
    @Query('category') category?: string,
    @Query('status') status?: InventoryStatus,
    @Query('available') available?: string,
  ) {
    if (category) {
      return this.inventoryService.getInventoryItemsByCategory(category);
    }

    if (status) {
      return this.inventoryService.getInventoryItemsByStatus(status);
    }

    if (available === 'true') {
      return this.inventoryService.getAvailableInventoryItems();
    }

    return this.inventoryService.getAllInventoryItems();
  }

  /**
   * GET /inventory/search
   * Search inventory items by name or description
   */
  @Get('search')
  async searchInventoryItems(@Query('q') searchTerm: string) {
    return this.inventoryService.searchInventoryItems(searchTerm);
  }

  /**
   * GET /inventory/categories
   * Get list of available categories
   */
  @Get('categories')
  getCategories() {
    return {
      categories: [
        'EXCAVATOR',
        'CRANE',
        'LOADER',
        'BULLDOZER',
        'FORKLIFT',
        'COMPACTOR',
        'GENERATOR',
        'SCAFFOLDING',
        'CONCRETE_MIXER',
        'DUMP_TRUCK',
        'OTHER',
      ],
    };
  }

  /**
   * GET /inventory/:id
   * Get inventory item by ID
   */
  @Get(':id')
  async getInventoryItemById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.getInventoryItemById(id);
  }

  /**
   * POST /inventory
   * Create a new inventory item
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInventoryItem(@Body() createDto: CreateInventoryItemDto) {
    return this.inventoryService.createInventoryItem(createDto);
  }

  /**
   * PUT /inventory/:id
   * Update an inventory item
   */
  @Put(':id')
  async updateInventoryItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateInventoryItem(id, updateDto);
  }

  /**
   * DELETE /inventory/:id
   * Delete an inventory item (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.inventoryService.deleteInventoryItem(id);
  }

  /**
   * PATCH /inventory/:id/maintenance
   * Set inventory item to maintenance status
   */
  @Patch(':id/maintenance')
  async setMaintenanceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('maintenance_date') maintenanceDate: string,
  ) {
    return this.inventoryService.setMaintenanceStatus(id, maintenanceDate);
  }

  // ==================== AVAILABILITY ====================

  /**
   * POST /inventory/:id/check-availability
   * Check availability for a specific date range
   */
  @Post(':id/check-availability')
  async checkAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() checkDto: CheckAvailabilityDto,
  ) {
    return this.inventoryService.checkAvailability(id, checkDto);
  }

  // ==================== RESERVATIONS ====================

  /**
   * GET /inventory/:id/reservations
   * Get all reservations for an inventory item
   */
  @Get(':id/reservations')
  async getReservations(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.getReservationsByInventoryId(id);
  }

  /**
   * POST /inventory/:id/reservations
   * Create a new reservation (book equipment)
   */
  @Post(':id/reservations')
  @HttpCode(HttpStatus.CREATED)
  async createReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: Omit<CreateReservationDto, 'inventory_id'>,
  ) {
    return this.inventoryService.createReservation({
      ...createDto,
      inventory_id: id,
    });
  }

  /**
   * GET /inventory/:id/reservations/:reservationId
   * Get reservation by ID
   */
  @Get(':id/reservations/:reservationId')
  async getReservationById(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
  ) {
    return this.inventoryService.getReservationById(id, reservationId);
  }

  /**
   * PUT /inventory/:id/reservations/:reservationId
   * Update a reservation
   */
  @Put(':id/reservations/:reservationId')
  async updateReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @Body() updateDto: UpdateReservationDto,
  ) {
    return this.inventoryService.updateReservation(
      id,
      reservationId,
      updateDto,
    );
  }

  /**
   * PATCH /inventory/:id/reservations/:reservationId/confirm
   * Confirm a pending reservation
   */
  @Patch(':id/reservations/:reservationId/confirm')
  async confirmReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
  ) {
    return this.inventoryService.confirmReservation(id, reservationId);
  }

  /**
   * PATCH /inventory/:id/reservations/:reservationId/start
   * Start rental (activate reservation)
   */
  @Patch(':id/reservations/:reservationId/start')
  async startRental(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
  ) {
    return this.inventoryService.startRental(id, reservationId);
  }

  /**
   * PATCH /inventory/:id/reservations/:reservationId/end
   * End rental (complete reservation)
   */
  @Patch(':id/reservations/:reservationId/end')
  async endRental(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
  ) {
    return this.inventoryService.endRental(id, reservationId);
  }

  /**
   * PATCH /inventory/:id/reservations/:reservationId/cancel
   * Cancel a reservation
   */
  @Patch(':id/reservations/:reservationId/cancel')
  async cancelReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
  ) {
    return this.inventoryService.cancelReservation(id, reservationId);
  }
}
