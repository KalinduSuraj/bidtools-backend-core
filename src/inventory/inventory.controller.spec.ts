import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
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

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: Partial<Record<keyof InventoryService, jest.Mock>>;

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
    status: 'AVAILABLE',
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
    start_date: '2030-03-01T08:00:00Z',
    end_date: '2030-03-05T18:00:00Z',
    status: 'PENDING',
    notes: 'Deliver to site A',
    created_at: '2025-02-20T10:00:00Z',
    updated_at: '2025-02-20T10:00:00Z',
  };

  beforeEach(async () => {
    service = {
      getAllInventoryItems: jest.fn(),
      getInventoryItemById: jest.fn(),
      getInventoryItemsByCategory: jest.fn(),
      getInventoryItemsByStatus: jest.fn(),
      getAvailableInventoryItems: jest.fn(),
      searchInventoryItems: jest.fn(),
      createInventoryItem: jest.fn(),
      updateInventoryItem: jest.fn(),
      deleteInventoryItem: jest.fn(),
      setMaintenanceStatus: jest.fn(),
      checkAvailability: jest.fn(),
      getReservationsByInventoryId: jest.fn(),
      createReservation: jest.fn(),
      getReservationById: jest.fn(),
      updateReservation: jest.fn(),
      confirmReservation: jest.fn(),
      startRental: jest.fn(),
      endRental: jest.fn(),
      cancelReservation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ==================== INVENTORY ITEMS ENDPOINTS ====================

  describe('getAllInventoryItems', () => {
    it('should return all inventory items when no filters', async () => {
      const mockItems = [mockInventoryItem];
      service.getAllInventoryItems!.mockResolvedValue(mockItems);

      const result = await controller.getAllInventoryItems();

      expect(result).toEqual(mockItems);
      expect(service.getAllInventoryItems).toHaveBeenCalledTimes(1);
    });

    it('should filter by category when provided', async () => {
      const mockItems = [mockInventoryItem];
      service.getInventoryItemsByCategory!.mockResolvedValue(mockItems);

      const result = await controller.getAllInventoryItems('EXCAVATOR');

      expect(result).toEqual(mockItems);
      expect(service.getInventoryItemsByCategory).toHaveBeenCalledWith(
        'EXCAVATOR',
      );
    });

    it('should filter by status when provided', async () => {
      const mockItems = [mockInventoryItem];
      service.getInventoryItemsByStatus!.mockResolvedValue(mockItems);

      const result = await controller.getAllInventoryItems(
        undefined,
        'AVAILABLE',
      );

      expect(result).toEqual(mockItems);
      expect(service.getInventoryItemsByStatus).toHaveBeenCalledWith(
        'AVAILABLE',
      );
    });

    it('should return available items when available=true', async () => {
      const mockItems = [mockInventoryItem];
      service.getAvailableInventoryItems!.mockResolvedValue(mockItems);

      const result = await controller.getAllInventoryItems(
        undefined,
        undefined,
        'true',
      );

      expect(result).toEqual(mockItems);
      expect(service.getAvailableInventoryItems).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchInventoryItems', () => {
    it('should search and return matching items', async () => {
      const mockItems = [mockInventoryItem];
      service.searchInventoryItems!.mockResolvedValue(mockItems);

      const result = await controller.searchInventoryItems('excavator');

      expect(result).toEqual(mockItems);
      expect(service.searchInventoryItems).toHaveBeenCalledWith('excavator');
    });
  });

  describe('getCategories', () => {
    it('should return list of categories', () => {
      const result = controller.getCategories();

      expect(result.categories).toContain('EXCAVATOR');
      expect(result.categories).toContain('CRANE');
      expect(result.categories).toContain('LOADER');
    });
  });

  describe('getInventoryItemById', () => {
    it('should return inventory item by ID', async () => {
      service.getInventoryItemById!.mockResolvedValue(mockInventoryItem);

      const result = await controller.getInventoryItemById(
        mockInventoryItem.inventory_id,
      );

      expect(result).toEqual(mockInventoryItem);
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
      service.createInventoryItem!.mockResolvedValue(mockInventoryItem);

      const result = await controller.createInventoryItem(createDto);

      expect(result).toEqual(mockInventoryItem);
      expect(service.createInventoryItem).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateInventoryItem', () => {
    it('should update an inventory item', async () => {
      const updateDto: UpdateInventoryItemDto = {
        name: 'Updated Excavator',
      };
      const updatedItem = { ...mockInventoryItem, name: 'Updated Excavator' };
      service.updateInventoryItem!.mockResolvedValue(updatedItem);

      const result = await controller.updateInventoryItem(
        mockInventoryItem.inventory_id,
        updateDto,
      );

      expect(result.name).toBe('Updated Excavator');
      expect(service.updateInventoryItem).toHaveBeenCalledWith(
        mockInventoryItem.inventory_id,
        updateDto,
      );
    });
  });

  describe('deleteInventoryItem', () => {
    it('should delete an inventory item', async () => {
      service.deleteInventoryItem!.mockResolvedValue(undefined);

      await controller.deleteInventoryItem(mockInventoryItem.inventory_id);

      expect(service.deleteInventoryItem).toHaveBeenCalledWith(
        mockInventoryItem.inventory_id,
      );
    });
  });

  describe('setMaintenanceStatus', () => {
    it('should set inventory item to maintenance status', async () => {
      const maintenanceItem = {
        ...mockInventoryItem,
        status: 'MAINTENANCE' as const,
      };
      service.setMaintenanceStatus!.mockResolvedValue(maintenanceItem);

      const result = await controller.setMaintenanceStatus(
        mockInventoryItem.inventory_id,
        '2025-02-21',
      );

      expect(result.status).toBe('MAINTENANCE');
      expect(service.setMaintenanceStatus).toHaveBeenCalledWith(
        mockInventoryItem.inventory_id,
        '2025-02-21',
      );
    });
  });

  // ==================== AVAILABILITY ENDPOINTS ====================

  describe('checkAvailability', () => {
    it('should check availability for date range', async () => {
      const checkDto: CheckAvailabilityDto = {
        start_date: '2030-03-01T08:00:00Z',
        end_date: '2030-03-05T18:00:00Z',
        quantity: 2,
      };
      const availabilityResult = {
        available: true,
        available_quantity: 5,
        requested_quantity: 2,
        conflicts: [],
      };
      service.checkAvailability!.mockResolvedValue(availabilityResult);

      const result = await controller.checkAvailability(
        mockInventoryItem.inventory_id,
        checkDto,
      );

      expect(result.available).toBe(true);
      expect(service.checkAvailability).toHaveBeenCalledWith(
        mockInventoryItem.inventory_id,
        checkDto,
      );
    });
  });

  // ==================== RESERVATIONS ENDPOINTS ====================

  describe('getReservations', () => {
    it('should return all reservations for an inventory item', async () => {
      service.getReservationsByInventoryId!.mockResolvedValue([
        mockReservation,
      ]);

      const result = await controller.getReservations(
        mockInventoryItem.inventory_id,
      );

      expect(result).toEqual([mockReservation]);
    });
  });

  describe('createReservation', () => {
    it('should create a reservation', async () => {
      const createDto: Omit<CreateReservationDto, 'inventory_id'> = {
        user_id: 'user-123',
        quantity: 2,
        start_date: '2030-03-01T08:00:00Z',
        end_date: '2030-03-05T18:00:00Z',
      };
      service.createReservation!.mockResolvedValue(mockReservation);

      const result = await controller.createReservation(
        mockInventoryItem.inventory_id,
        createDto,
      );

      expect(result).toEqual(mockReservation);
      expect(service.createReservation).toHaveBeenCalledWith({
        ...createDto,
        inventory_id: mockInventoryItem.inventory_id,
      });
    });
  });

  describe('getReservationById', () => {
    it('should return reservation by ID', async () => {
      service.getReservationById!.mockResolvedValue(mockReservation);

      const result = await controller.getReservationById(
        mockInventoryItem.inventory_id,
        mockReservation.reservation_id,
      );

      expect(result).toEqual(mockReservation);
    });
  });

  describe('updateReservation', () => {
    it('should update a reservation', async () => {
      const updateDto = { notes: 'Updated notes' };
      const updatedReservation = { ...mockReservation, notes: 'Updated notes' };
      service.updateReservation!.mockResolvedValue(updatedReservation);

      const result = await controller.updateReservation(
        mockInventoryItem.inventory_id,
        mockReservation.reservation_id,
        updateDto,
      );

      expect(result.notes).toBe('Updated notes');
    });
  });

  describe('confirmReservation', () => {
    it('should confirm a reservation', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: 'CONFIRMED' as const,
      };
      service.confirmReservation!.mockResolvedValue(confirmedReservation);

      const result = await controller.confirmReservation(
        mockInventoryItem.inventory_id,
        mockReservation.reservation_id,
      );

      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('startRental', () => {
    it('should start rental (activate reservation)', async () => {
      const activeReservation = {
        ...mockReservation,
        status: 'ACTIVE' as const,
      };
      service.startRental!.mockResolvedValue(activeReservation);

      const result = await controller.startRental(
        mockInventoryItem.inventory_id,
        mockReservation.reservation_id,
      );

      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('endRental', () => {
    it('should end rental (complete reservation)', async () => {
      const completedReservation = {
        ...mockReservation,
        status: 'COMPLETED' as const,
      };
      service.endRental!.mockResolvedValue(completedReservation);

      const result = await controller.endRental(
        mockInventoryItem.inventory_id,
        mockReservation.reservation_id,
      );

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a reservation', async () => {
      const cancelledReservation = {
        ...mockReservation,
        status: 'CANCELLED' as const,
      };
      service.cancelReservation!.mockResolvedValue(cancelledReservation);

      const result = await controller.cancelReservation(
        mockInventoryItem.inventory_id,
        mockReservation.reservation_id,
      );

      expect(result.status).toBe('CANCELLED');
    });
  });
});
