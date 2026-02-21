import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import { DynomodbModule } from '../common/dynomodb/dynomodb.module';

/**
 * Inventory Module
 *
 * Manages construction equipment inventory including:
 * - Equipment CRUD operations
 * - Quantity and availability tracking
 * - Reservations and bookings
 * - Double-booking prevention
 *
 * Integrates with:
 * - Rental Module: Links reservations to rentals
 * - Supplier Module: Tracks equipment suppliers
 * - User Management: Tracks who makes reservations
 */
@Module({
  imports: [DynomodbModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService, InventoryRepository],
})
export class InventoryModule {}
