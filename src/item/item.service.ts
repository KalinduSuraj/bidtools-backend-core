import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { ItemRepository } from './item.repository';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ItemService {
  constructor(private readonly itemRepository: ItemRepository) {}

  /**
   * Create a new item for a supplier
   * @param supplierId - Supplier ID from authenticated user's JWT token
   * @param createItemDto - Item data
   */
  async createItem(
    supplierId: string,
    createItemDto: CreateItemDto,
  ): Promise<Item> {
    const itemId = uuid();
    const now = new Date().toISOString();

    const newItem: Item = {
      item_id: itemId,
      supplier_id: supplierId, // From JWT token
      name: createItemDto.name,
      description: createItemDto.description || '',
      price_per_day: createItemDto.price_per_day,
      price_per_hour: createItemDto.price_per_hour,
      status: createItemDto.status || 'available',
      latitude: createItemDto.latitude,
      longitude: createItemDto.longitude,
      created_at: now,
    };

    await this.itemRepository.saveItem(newItem);
    return newItem;
  }

  async getAllItems(): Promise<Item[]> {
    return this.itemRepository.getAllItems();
  }

  async getItemsBySupplier(supplierId: string): Promise<Item[]> {
    return this.itemRepository.getItemsBySupplier(supplierId);
  }

  async getItemById(supplierId: string, itemId: string): Promise<Item> {
    const item = await this.itemRepository.getItemById(supplierId, itemId);
    if (!item) {
      throw new NotFoundException(
        `Item with ID "${itemId}" not found for supplier "${supplierId}"`,
      );
    }
    return item;
  }

  async updateItem(
    supplierId: string,
    itemId: string,
    updateItemDto: UpdateItemDto,
  ): Promise<Item> {
    const existingItem = await this.getItemById(supplierId, itemId);

    const updatedItem: Item = {
      ...existingItem,
      ...updateItemDto,
      supplier_id: supplierId, // Keep original supplier
      item_id: itemId, // Keep original item id
      updated_at: new Date().toISOString(),
    };

    await this.itemRepository.updateItem(updatedItem);
    return updatedItem;
  }

  /**
   * Soft delete an item (sets is_deleted=true)
   */
  async deleteItem(supplierId: string, itemId: string): Promise<string> {
    const existingItem = await this.getItemById(supplierId, itemId);

    const deletedItem: Item = {
      ...existingItem,
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.itemRepository.updateItem(deletedItem);
    return `Item with ID "${itemId}" has been deleted`;
  }

  /**
   * Change item availability status
   */
  async changeStatus(
    supplierId: string,
    itemId: string,
    status: 'available' | 'rented' | 'maintenance' | 'inactive',
  ): Promise<Item> {
    const existingItem = await this.getItemById(supplierId, itemId);

    const updatedItem: Item = {
      ...existingItem,
      status,
      updated_at: new Date().toISOString(),
    };

    await this.itemRepository.updateItem(updatedItem);
    return updatedItem;
  }

  async getItemsByStatus(status: string): Promise<Item[]> {
    return this.itemRepository.getItemsByStatus(status);
  }

  /**
   * Get item by item_id only (uses GSI1)
   * Useful for public item pages where supplier_id is unknown
   */
  async getItemByIdOnly(itemId: string): Promise<Item> {
    const item = await this.itemRepository.getItemByIdOnly(itemId);
    if (!item) {
      throw new NotFoundException(`Item with ID "${itemId}" not found`);
    }
    return item;
  }
}
