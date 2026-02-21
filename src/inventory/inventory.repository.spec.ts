import { Test, TestingModule } from '@nestjs/testing';
import { InventoryRepository } from './inventory.repository';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';
import {
  InventoryItem,
  InventoryReservation,
} from './entities/inventory-item.entity';

describe('InventoryRepository', () => {
  let repository: InventoryRepository;
  let mockDbClient: { send: jest.Mock };

  // Sample test data
  const mockInventoryItem: InventoryItem = {
    inventory_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Excavator CAT 320',
    description: 'Heavy-duty excavator',
    category: 'EXCAVATOR',
    model: 'CAT-320-2023',
    serial_number: 'EXC-001-2023',
    total_quantity: 5,
    available_quantity: 3,
    reserved_quantity: 2,
    daily_rate: 25000,
    hourly_rate: 3500,
    currency: 'LKR',
    status: 'PARTIALLY_AVAILABLE',
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
    start_date: '2025-03-01T08:00:00Z',
    end_date: '2025-03-05T18:00:00Z',
    status: 'CONFIRMED',
    notes: 'Deliver to site A',
    created_at: '2025-02-20T10:00:00Z',
    updated_at: '2025-02-20T10:00:00Z',
  };

  beforeEach(async () => {
    mockDbClient = {
      send: jest.fn(),
    };

    const mockDynomodbService = {
      client: mockDbClient,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryRepository,
        {
          provide: DynomodbService,
          useValue: mockDynomodbService,
        },
      ],
    }).compile();

    repository = module.get<InventoryRepository>(InventoryRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // ==================== INVENTORY ITEMS TESTS ====================

  describe('getAllInventoryItems', () => {
    it('should return all non-deleted inventory items', async () => {
      const mockItems = [mockInventoryItem];
      mockDbClient.send.mockResolvedValue({ Items: mockItems });

      const result = await repository.getAllInventoryItems();

      expect(result).toEqual(mockItems);
      expect(mockDbClient.send).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no items exist', async () => {
      mockDbClient.send.mockResolvedValue({ Items: [] });

      const result = await repository.getAllInventoryItems();

      expect(result).toEqual([]);
    });

    it('should return empty array when Items is undefined', async () => {
      mockDbClient.send.mockResolvedValue({});

      const result = await repository.getAllInventoryItems();

      expect(result).toEqual([]);
    });
  });

  describe('getInventoryItemById', () => {
    it('should return inventory item when found and not deleted', async () => {
      mockDbClient.send.mockResolvedValue({ Item: mockInventoryItem });

      const result = await repository.getInventoryItemById(
        mockInventoryItem.inventory_id,
      );

      expect(result).toEqual(mockInventoryItem);
    });

    it('should return null when item not found', async () => {
      mockDbClient.send.mockResolvedValue({ Item: undefined });

      const result = await repository.getInventoryItemById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null when item is soft-deleted', async () => {
      const deletedItem = { ...mockInventoryItem, is_deleted: true };
      mockDbClient.send.mockResolvedValue({ Item: deletedItem });

      const result = await repository.getInventoryItemById(
        mockInventoryItem.inventory_id,
      );

      expect(result).toBeNull();
    });
  });

  describe('getInventoryItemsByCategory', () => {
    it('should return items matching the category', async () => {
      const mockItems = [mockInventoryItem];
      mockDbClient.send.mockResolvedValue({ Items: mockItems });

      const result = await repository.getInventoryItemsByCategory('EXCAVATOR');

      expect(result).toEqual(mockItems);
      expect(mockDbClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            IndexName: 'GSI1',
          }),
        }),
      );
    });

    it('should return empty array when no items in category', async () => {
      mockDbClient.send.mockResolvedValue({ Items: [] });

      const result = await repository.getInventoryItemsByCategory('UNKNOWN');

      expect(result).toEqual([]);
    });
  });

  describe('getInventoryItemsByStatus', () => {
    it('should return items matching the status', async () => {
      const mockItems = [mockInventoryItem];
      mockDbClient.send.mockResolvedValue({ Items: mockItems });

      const result = await repository.getInventoryItemsByStatus('AVAILABLE');

      expect(result).toEqual(mockItems);
      expect(mockDbClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            IndexName: 'GSI2',
          }),
        }),
      );
    });
  });

  describe('getAvailableInventoryItems', () => {
    it('should return items with available_quantity > 0', async () => {
      const mockItems = [mockInventoryItem];
      mockDbClient.send.mockResolvedValue({ Items: mockItems });

      const result = await repository.getAvailableInventoryItems();

      expect(result).toEqual(mockItems);
    });
  });

  describe('saveInventoryItem', () => {
    it('should save a new inventory item', async () => {
      mockDbClient.send.mockResolvedValue({});

      await repository.saveInventoryItem(mockInventoryItem);

      expect(mockDbClient.send).toHaveBeenCalledTimes(1);
      expect(mockDbClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Item: expect.objectContaining({
              PK: 'INVENTORY',
              SK: `ITEM#${mockInventoryItem.inventory_id}`,
              GSI1PK: `CATEGORY#${mockInventoryItem.category}`,
              GSI2PK: `STATUS#${mockInventoryItem.status}`,
            }),
          }),
        }),
      );
    });
  });

  describe('updateInventoryItem', () => {
    it('should update an existing inventory item', async () => {
      mockDbClient.send.mockResolvedValue({});

      await repository.updateInventoryItem(mockInventoryItem);

      expect(mockDbClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateInventoryQuantities', () => {
    it('should update inventory quantities and status', async () => {
      mockDbClient.send.mockResolvedValue({});

      await repository.updateInventoryQuantities(
        mockInventoryItem.inventory_id,
        3,
        2,
        'PARTIALLY_AVAILABLE',
      );

      expect(mockDbClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteInventoryItem', () => {
    it('should soft delete an inventory item', async () => {
      mockDbClient.send.mockResolvedValue({});

      await repository.deleteInventoryItem(mockInventoryItem.inventory_id);

      expect(mockDbClient.send).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== RESERVATIONS TESTS ====================

  describe('getReservationsByInventoryId', () => {
    it('should return all reservations for an inventory item', async () => {
      const mockReservations = [mockReservation];
      mockDbClient.send.mockResolvedValue({ Items: mockReservations });

      const result = await repository.getReservationsByInventoryId(
        mockInventoryItem.inventory_id,
      );

      expect(result).toEqual(mockReservations);
    });

    it('should return empty array when no reservations exist', async () => {
      mockDbClient.send.mockResolvedValue({ Items: [] });

      const result =
        await repository.getReservationsByInventoryId('no-reservations-id');

      expect(result).toEqual([]);
    });
  });

  describe('getActiveReservations', () => {
    it('should return only PENDING, CONFIRMED, or ACTIVE reservations', async () => {
      const activeReservations = [
        { ...mockReservation, status: 'PENDING' },
        { ...mockReservation, reservation_id: 'res-2', status: 'CONFIRMED' },
        { ...mockReservation, reservation_id: 'res-3', status: 'ACTIVE' },
      ];
      mockDbClient.send.mockResolvedValue({ Items: activeReservations });

      const result = await repository.getActiveReservations(
        mockInventoryItem.inventory_id,
      );

      expect(result).toHaveLength(3);
    });
  });

  describe('getReservationById', () => {
    it('should return reservation when found', async () => {
      mockDbClient.send.mockResolvedValue({ Item: mockReservation });

      const result = await repository.getReservationById(
        mockReservation.inventory_id,
        mockReservation.reservation_id,
      );

      expect(result).toEqual(mockReservation);
    });

    it('should return null when reservation not found', async () => {
      mockDbClient.send.mockResolvedValue({ Item: undefined });

      const result = await repository.getReservationById(
        'inv-id',
        'non-existent',
      );

      expect(result).toBeNull();
    });
  });

  describe('saveReservation', () => {
    it('should save a new reservation', async () => {
      mockDbClient.send.mockResolvedValue({});

      await repository.saveReservation(mockReservation);

      expect(mockDbClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Item: expect.objectContaining({
              PK: 'RESERVATION',
              SK: `ITEM#${mockReservation.inventory_id}#${mockReservation.reservation_id}`,
              GSI1PK: `INVENTORY#${mockReservation.inventory_id}`,
            }),
          }),
        }),
      );
    });
  });

  describe('updateReservation', () => {
    it('should update an existing reservation', async () => {
      mockDbClient.send.mockResolvedValue({});

      await repository.updateReservation(mockReservation);

      expect(mockDbClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateReservationStatus', () => {
    it('should update reservation status', async () => {
      mockDbClient.send.mockResolvedValue({});

      await repository.updateReservationStatus(
        mockReservation.inventory_id,
        mockReservation.reservation_id,
        'COMPLETED',
      );

      expect(mockDbClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteReservation', () => {
    it('should hard delete a reservation', async () => {
      mockDbClient.send.mockResolvedValue({});

      await repository.deleteReservation(
        mockReservation.inventory_id,
        mockReservation.reservation_id,
      );

      expect(mockDbClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchInventoryItems', () => {
    it('should search inventory items by term', async () => {
      const mockItems = [mockInventoryItem];
      mockDbClient.send.mockResolvedValue({ Items: mockItems });

      const result = await repository.searchInventoryItems('excavator');

      expect(result).toEqual(mockItems);
    });

    it('should return empty array when no matches found', async () => {
      mockDbClient.send.mockResolvedValue({ Items: [] });

      const result = await repository.searchInventoryItems('nonexistent');

      expect(result).toEqual([]);
    });
  });
});
