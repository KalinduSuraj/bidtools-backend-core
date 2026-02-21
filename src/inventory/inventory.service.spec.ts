import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  InventoryItem,
  InventoryReservation,
} from './entities/inventory-item.entity';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  CreateReservationDto,
  CheckAvailabilityDto,
} from './dto';

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: Partial<Record<keyof InventoryRepository, jest.Mock>>;

  // Sample test data
  const mockInventoryItem: InventoryItem = {
    inventory_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Excavator CAT 320',
    description: 'Heavy-duty excavator',
    category: 'EXCAVATOR',
    model: 'CAT-320-2023',
    serial_number: 'EXC-001-2023',
    total_quantity: 5,
    available_quantity: 5,
    reserved_quantity: 0,
    daily_rate: 25000,
    hourly_rate: 3500,
    currency: 'LKR',
    status: 'AVAILABLE' as const,
    location: 'Colombo Warehouse',
    supplier_id: 'sup-123',
    condition_rating: 4,
    min_rental_duration: 4,
    max_rental_duration: 365,
    images: [],
    tags: ['heavy', 'earthmoving'],
    created_at: '2025-01-15T08:00:00Z',
    updated_at: '2025-02-20T10:30:00Z',
    is_deleted: false,
  };

  const mockReservation: InventoryReservation = {
    reservation_id: 'res-550e8400',
    inventory_id: '550e8400-e29b-41d4-a716-446655440000',
    rental_id: 'rental-456',
    user_id: 'user-789',
    quantity: 2,
    start_date: '2030-03-01T08:00:00Z', // Future date
    end_date: '2030-03-05T18:00:00Z',
    status: 'PENDING',
    notes: 'Deliver to site A',
    created_at: '2025-02-20T10:00:00Z',
    updated_at: '2025-02-20T10:00:00Z',
  };

  beforeEach(async () => {
    repository = {
      getAllInventoryItems: jest.fn(),
      getInventoryItemById: jest.fn(),
      getInventoryItemsByCategory: jest.fn(),
      getInventoryItemsByStatus: jest.fn(),
      getAvailableInventoryItems: jest.fn(),
      searchInventoryItems: jest.fn(),
      saveInventoryItem: jest.fn(),
      updateInventoryItem: jest.fn(),
      updateInventoryQuantities: jest.fn(),
      deleteInventoryItem: jest.fn(),
      getReservationsByInventoryId: jest.fn(),
      getActiveReservations: jest.fn(),
      getReservationById: jest.fn(),
      saveReservation: jest.fn(),
      updateReservation: jest.fn(),
      updateReservationStatus: jest.fn(),
      deleteReservation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: InventoryRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== INVENTORY ITEMS TESTS ====================

  describe('getAllInventoryItems', () => {
    it('should return all inventory items', async () => {
      const mockItems = [mockInventoryItem];
      repository.getAllInventoryItems!.mockResolvedValue(mockItems);

      const result = await service.getAllInventoryItems();

      expect(result).toEqual(mockItems);
      expect(repository.getAllInventoryItems).toHaveBeenCalledTimes(1);
    });
  });

  describe('getInventoryItemById', () => {
    it('should return inventory item when found', async () => {
      repository.getInventoryItemById!.mockResolvedValue(mockInventoryItem);

      const result = await service.getInventoryItemById(
        mockInventoryItem.inventory_id,
      );

      expect(result).toEqual(mockInventoryItem);
    });

    it('should throw NotFoundException when item not found', async () => {
      repository.getInventoryItemById!.mockResolvedValue(null);

      await expect(
        service.getInventoryItemById('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInventoryItemsByCategory', () => {
    it('should return items by category (uppercase)', async () => {
      const mockItems = [mockInventoryItem];
      repository.getInventoryItemsByCategory!.mockResolvedValue(mockItems);

      const result = await service.getInventoryItemsByCategory('excavator');

      expect(repository.getInventoryItemsByCategory).toHaveBeenCalledWith(
        'EXCAVATOR',
      );
      expect(result).toEqual(mockItems);
    });
  });

  describe('getInventoryItemsByStatus', () => {
    it('should return items by status', async () => {
      const mockItems = [mockInventoryItem];
      repository.getInventoryItemsByStatus!.mockResolvedValue(mockItems);

      const result = await service.getInventoryItemsByStatus('AVAILABLE');

      expect(result).toEqual(mockItems);
    });
  });

  describe('getAvailableInventoryItems', () => {
    it('should return available inventory items', async () => {
      const mockItems = [mockInventoryItem];
      repository.getAvailableInventoryItems!.mockResolvedValue(mockItems);

      const result = await service.getAvailableInventoryItems();

      expect(result).toEqual(mockItems);
    });
  });

  describe('searchInventoryItems', () => {
    it('should search and return matching items', async () => {
      const mockItems = [mockInventoryItem];
      repository.searchInventoryItems!.mockResolvedValue(mockItems);

      const result = await service.searchInventoryItems('excavator');

      expect(result).toEqual(mockItems);
    });

    it('should throw BadRequestException for short search term', async () => {
      await expect(service.searchInventoryItems('a')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for empty search term', async () => {
      await expect(service.searchInventoryItems('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createInventoryItem', () => {
    it('should create a new inventory item', async () => {
      const createDto: CreateInventoryItemDto = {
        name: 'Excavator CAT 320',
        description: 'Heavy-duty excavator',
        category: 'EXCAVATOR',
        model: 'CAT-320-2023',
        serial_number: 'EXC-001-2023',
        total_quantity: 5,
        daily_rate: 25000,
        location: 'Colombo Warehouse',
      };

      repository.saveInventoryItem!.mockResolvedValue(undefined);

      const result = await service.createInventoryItem(createDto);

      expect(result).toMatchObject({
        name: createDto.name,
        category: 'EXCAVATOR',
        total_quantity: 5,
        available_quantity: 5,
        reserved_quantity: 0,
        status: 'AVAILABLE',
      });
      expect(repository.saveInventoryItem).toHaveBeenCalledTimes(1);
    });

    it('should set default values for optional fields', async () => {
      const createDto: CreateInventoryItemDto = {
        name: 'Test Item',
        description: 'Test description',
        category: 'CRANE',
        model: 'CRANE-001',
        serial_number: 'CR-001',
        total_quantity: 3,
        daily_rate: 15000,
        location: 'Warehouse A',
      };

      const result = await service.createInventoryItem(createDto);

      expect(result.currency).toBe('LKR');
      expect(result.condition_rating).toBe(5);
      expect(result.min_rental_duration).toBe(1);
      expect(result.max_rental_duration).toBe(365);
    });
  });

  describe('updateInventoryItem', () => {
    it('should update an existing inventory item', async () => {
      repository.getInventoryItemById!.mockResolvedValue(mockInventoryItem);
      repository.updateInventoryItem!.mockResolvedValue(undefined);

      const updateDto: UpdateInventoryItemDto = {
        name: 'Updated Excavator',
        daily_rate: 30000,
      };

      const result = await service.updateInventoryItem(
        mockInventoryItem.inventory_id,
        updateDto,
      );

      expect(result.name).toBe('Updated Excavator');
      expect(result.daily_rate).toBe(30000);
      expect(repository.updateInventoryItem).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when item not found', async () => {
      repository.getInventoryItemById!.mockResolvedValue(null);

      await expect(
        service.updateInventoryItem('non-existent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update quantities correctly when total_quantity changes', async () => {
      const itemWithReservation = {
        ...mockInventoryItem,
        total_quantity: 5,
        available_quantity: 3,
        reserved_quantity: 2,
      };
      repository.getInventoryItemById!.mockResolvedValue(itemWithReservation);
      repository.updateInventoryItem!.mockResolvedValue(undefined);

      const result = await service.updateInventoryItem(
        mockInventoryItem.inventory_id,
        { total_quantity: 7 },
      );

      expect(result.total_quantity).toBe(7);
      expect(result.available_quantity).toBe(5); // 3 + (7-5)
    });

    it('should throw BadRequestException when reducing quantity below reserved', async () => {
      const itemWithReservation = {
        ...mockInventoryItem,
        total_quantity: 5,
        available_quantity: 2,
        reserved_quantity: 3,
      };
      repository.getInventoryItemById!.mockResolvedValue(itemWithReservation);

      await expect(
        service.updateInventoryItem(mockInventoryItem.inventory_id, {
          total_quantity: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteInventoryItem', () => {
    it('should delete an inventory item', async () => {
      repository.getInventoryItemById!.mockResolvedValue(mockInventoryItem);
      repository.getActiveReservations!.mockResolvedValue([]);
      repository.deleteInventoryItem!.mockResolvedValue(undefined);

      await service.deleteInventoryItem(mockInventoryItem.inventory_id);

      expect(repository.deleteInventoryItem).toHaveBeenCalledWith(
        mockInventoryItem.inventory_id,
      );
    });

    it('should throw NotFoundException when item not found', async () => {
      repository.getInventoryItemById!.mockResolvedValue(null);

      await expect(service.deleteInventoryItem('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when item has active reservations', async () => {
      repository.getInventoryItemById!.mockResolvedValue(mockInventoryItem);
      repository.getActiveReservations!.mockResolvedValue([mockReservation]);

      await expect(
        service.deleteInventoryItem(mockInventoryItem.inventory_id),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('setMaintenanceStatus', () => {
    it('should set item to maintenance status', async () => {
      // Use a copy to avoid mutating the shared mock object
      const itemCopy = { ...mockInventoryItem };
      repository.getInventoryItemById!.mockResolvedValue(itemCopy);
      repository.updateInventoryItem!.mockResolvedValue(undefined);

      const result = await service.setMaintenanceStatus(
        mockInventoryItem.inventory_id,
        '2025-02-21',
      );

      expect(result.status).toBe('MAINTENANCE');
      expect(result.last_maintenance_date).toBe('2025-02-21');
    });

    it('should throw ConflictException when units are reserved', async () => {
      const itemWithReservation = {
        ...mockInventoryItem,
        reserved_quantity: 2,
      };
      repository.getInventoryItemById!.mockResolvedValue(itemWithReservation);

      await expect(
        service.setMaintenanceStatus(
          mockInventoryItem.inventory_id,
          '2025-02-21',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ==================== AVAILABILITY TESTS ====================

  describe('checkAvailability', () => {
    it('should return available=true when enough units available', async () => {
      // Use a fresh copy to avoid state from previous tests
      const freshItem = { ...mockInventoryItem, status: 'AVAILABLE' as const };
      repository.getInventoryItemById!.mockResolvedValue(freshItem);
      // Return empty array - no overlapping reservations
      repository.getActiveReservations!.mockResolvedValue([]);

      const checkDto: CheckAvailabilityDto = {
        start_date: '2030-03-01T08:00:00Z',
        end_date: '2030-03-05T18:00:00Z',
        quantity: 2,
      };

      const result = await service.checkAvailability(
        mockInventoryItem.inventory_id,
        checkDto,
      );

      expect(result.available).toBe(true);
      expect(result.available_quantity).toBe(5);
      expect(result.requested_quantity).toBe(2);
      expect(result.conflicts).toEqual([]);
    });

    it('should return available=false when not enough units due to overlapping reservation', async () => {
      // Use a fresh copy to avoid state from previous tests
      const freshItem = { ...mockInventoryItem, status: 'AVAILABLE' as const };
      repository.getInventoryItemById!.mockResolvedValue(freshItem);
      // Return reservation that overlaps with the check dates
      const overlappingReservation = {
        ...mockReservation,
        start_date: '2030-03-01T08:00:00Z', // Same as check dates
        end_date: '2030-03-05T18:00:00Z',
        quantity: 4,
      };
      repository.getActiveReservations!.mockResolvedValue([
        overlappingReservation,
      ]);

      const checkDto: CheckAvailabilityDto = {
        start_date: '2030-03-01T08:00:00Z',
        end_date: '2030-03-05T18:00:00Z',
        quantity: 3,
      };

      const result = await service.checkAvailability(
        mockInventoryItem.inventory_id,
        checkDto,
      );

      expect(result.available).toBe(false);
      expect(result.available_quantity).toBe(1); // 5 - 4 = 1
      expect(result.conflicts).toHaveLength(1);
    });

    it('should return available=false for MAINTENANCE status', async () => {
      const maintenanceItem = {
        ...mockInventoryItem,
        status: 'MAINTENANCE' as const,
      };
      repository.getInventoryItemById!.mockResolvedValue(maintenanceItem);

      const checkDto: CheckAvailabilityDto = {
        start_date: '2030-03-01T08:00:00Z',
        end_date: '2030-03-05T18:00:00Z',
        quantity: 1,
      };

      const result = await service.checkAvailability(
        mockInventoryItem.inventory_id,
        checkDto,
      );

      expect(result.available).toBe(false);
      expect(result.available_quantity).toBe(0);
    });

    it('should throw BadRequestException when start_date >= end_date', async () => {
      // Use a fresh copy to avoid state from previous tests
      const freshItem = { ...mockInventoryItem, status: 'AVAILABLE' as const };
      repository.getInventoryItemById!.mockResolvedValue(freshItem);

      const checkDto: CheckAvailabilityDto = {
        start_date: '2030-03-05T08:00:00Z',
        end_date: '2030-03-01T18:00:00Z', // End before start
        quantity: 1,
      };

      await expect(
        service.checkAvailability(mockInventoryItem.inventory_id, checkDto),
      ).rejects.toThrow('Start date must be before end date');
    });
  });

  // ==================== RESERVATIONS TESTS ====================

  describe('createReservation', () => {
    it('should create a reservation successfully', async () => {
      // Use a fresh copy to avoid state from previous tests
      const freshItem = { ...mockInventoryItem, status: 'AVAILABLE' as const };
      // Mock needs to return item for both direct call and checkAvailability call
      repository.getInventoryItemById!.mockResolvedValue(freshItem);
      // Return empty array for no conflicts - called by checkAvailability AND updateInventoryOnReservation
      repository.getActiveReservations!.mockResolvedValue([]);
      repository.saveReservation!.mockResolvedValue(undefined);
      repository.updateInventoryQuantities!.mockResolvedValue(undefined);

      const createDto: CreateReservationDto = {
        inventory_id: mockInventoryItem.inventory_id,
        user_id: 'user-123',
        quantity: 2,
        start_date: '2030-03-01T08:00:00Z',
        end_date: '2030-03-05T18:00:00Z',
      };

      const result = await service.createReservation(createDto);

      expect(result).toMatchObject({
        inventory_id: createDto.inventory_id,
        user_id: createDto.user_id,
        quantity: 2,
        status: 'PENDING',
      });
      expect(repository.saveReservation).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when not enough availability (double-booking prevention)', async () => {
      repository.getInventoryItemById!.mockResolvedValue(mockInventoryItem);
      // Return overlapping reservation with same date range
      const overlappingReservation = {
        ...mockReservation,
        start_date: '2030-03-01T08:00:00Z',
        end_date: '2030-03-05T18:00:00Z',
        quantity: 4,
      };
      repository.getActiveReservations!.mockResolvedValue([
        overlappingReservation,
      ]);

      const createDto: CreateReservationDto = {
        inventory_id: mockInventoryItem.inventory_id,
        user_id: 'user-123',
        quantity: 3,
        start_date: '2030-03-01T08:00:00Z',
        end_date: '2030-03-05T18:00:00Z',
      };

      await expect(service.createReservation(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException for invalid date range', async () => {
      repository.getInventoryItemById!.mockResolvedValue(mockInventoryItem);

      const createDto: CreateReservationDto = {
        inventory_id: mockInventoryItem.inventory_id,
        user_id: 'user-123',
        quantity: 1,
        start_date: '2030-03-10T08:00:00Z',
        end_date: '2030-03-05T18:00:00Z', // End before start
      };

      await expect(service.createReservation(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getReservationById', () => {
    it('should return reservation when found', async () => {
      repository.getReservationById!.mockResolvedValue(mockReservation);

      const result = await service.getReservationById(
        mockReservation.inventory_id,
        mockReservation.reservation_id,
      );

      expect(result).toEqual(mockReservation);
    });

    it('should throw NotFoundException when not found', async () => {
      repository.getReservationById!.mockResolvedValue(null);

      await expect(
        service.getReservationById('inv-id', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmReservation', () => {
    it('should confirm a PENDING reservation', async () => {
      const pendingReservation = {
        ...mockReservation,
        status: 'PENDING' as const,
      };
      repository.getReservationById!.mockResolvedValue(pendingReservation);
      repository.updateReservation!.mockResolvedValue(undefined);

      const result = await service.confirmReservation(
        mockReservation.inventory_id,
        mockReservation.reservation_id,
      );

      expect(result.status).toBe('CONFIRMED');
    });

    it('should throw BadRequestException when not PENDING', async () => {
      const activeReservation = {
        ...mockReservation,
        status: 'ACTIVE' as const,
      };
      repository.getReservationById!.mockResolvedValue(activeReservation);

      await expect(
        service.confirmReservation(
          mockReservation.inventory_id,
          mockReservation.reservation_id,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('startRental', () => {
    it('should start rental for CONFIRMED reservation', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: 'CONFIRMED' as const,
      };
      repository.getReservationById!.mockResolvedValue(confirmedReservation);
      repository.updateReservation!.mockResolvedValue(undefined);
      repository.getInventoryItemById!.mockResolvedValue(mockInventoryItem);
      repository.getActiveReservations!.mockResolvedValue([
        confirmedReservation,
      ]);
      repository.updateInventoryQuantities!.mockResolvedValue(undefined);

      const result = await service.startRental(
        mockReservation.inventory_id,
        mockReservation.reservation_id,
      );

      expect(result.status).toBe('ACTIVE');
    });

    it('should throw BadRequestException when not CONFIRMED', async () => {
      const pendingReservation = {
        ...mockReservation,
        status: 'PENDING' as const,
      };
      repository.getReservationById!.mockResolvedValue(pendingReservation);

      await expect(
        service.startRental(
          mockReservation.inventory_id,
          mockReservation.reservation_id,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('endRental', () => {
    it('should end rental for ACTIVE reservation', async () => {
      const activeReservation = {
        ...mockReservation,
        status: 'ACTIVE' as const,
      };
      repository.getReservationById!.mockResolvedValue(activeReservation);
      repository.updateReservation!.mockResolvedValue(undefined);
      repository.getInventoryItemById!.mockResolvedValue(mockInventoryItem);
      repository.getActiveReservations!.mockResolvedValue([]);
      repository.updateInventoryQuantities!.mockResolvedValue(undefined);

      const result = await service.endRental(
        mockReservation.inventory_id,
        mockReservation.reservation_id,
      );

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw BadRequestException when not ACTIVE', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: 'CONFIRMED' as const,
      };
      repository.getReservationById!.mockResolvedValue(confirmedReservation);

      await expect(
        service.endRental(
          mockReservation.inventory_id,
          mockReservation.reservation_id,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a PENDING reservation', async () => {
      const pendingReservation = {
        ...mockReservation,
        status: 'PENDING' as const,
      };
      repository.getReservationById!.mockResolvedValue(pendingReservation);
      repository.updateReservation!.mockResolvedValue(undefined);
      repository.getInventoryItemById!.mockResolvedValue(mockInventoryItem);
      repository.getActiveReservations!.mockResolvedValue([]);
      repository.updateInventoryQuantities!.mockResolvedValue(undefined);

      const result = await service.cancelReservation(
        mockReservation.inventory_id,
        mockReservation.reservation_id,
      );

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw BadRequestException when COMPLETED', async () => {
      const completedReservation = {
        ...mockReservation,
        status: 'COMPLETED' as const,
      };
      repository.getReservationById!.mockResolvedValue(completedReservation);

      await expect(
        service.cancelReservation(
          mockReservation.inventory_id,
          mockReservation.reservation_id,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when already CANCELLED', async () => {
      const cancelledReservation = {
        ...mockReservation,
        status: 'CANCELLED' as const,
      };
      repository.getReservationById!.mockResolvedValue(cancelledReservation);

      await expect(
        service.cancelReservation(
          mockReservation.inventory_id,
          mockReservation.reservation_id,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getReservationsByInventoryId', () => {
    it('should return all reservations for an inventory item', async () => {
      repository.getInventoryItemById!.mockResolvedValue(mockInventoryItem);
      repository.getReservationsByInventoryId!.mockResolvedValue([
        mockReservation,
      ]);

      const result = await service.getReservationsByInventoryId(
        mockInventoryItem.inventory_id,
      );

      expect(result).toEqual([mockReservation]);
    });

    it('should throw NotFoundException when inventory item not found', async () => {
      repository.getInventoryItemById!.mockResolvedValue(null);

      await expect(
        service.getReservationsByInventoryId('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
