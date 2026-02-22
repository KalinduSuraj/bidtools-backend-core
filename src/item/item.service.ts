import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { ItemRepository } from './item.repository';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ItemService {
  constructor(private readonly itemRepository: ItemRepository) {}

  async createItem(createItemDto: CreateItemDto): Promise<Item> {
    const itemId = uuid();
    const now = new Date().toISOString();

    const newItem: Item = {
      item_id: itemId,
      supplier_id: createItemDto.supplier_id,
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
    };

    await this.itemRepository.updateItem(updatedItem);
    return updatedItem;
  }

  async deleteItem(supplierId: string, itemId: string): Promise<string> {
    await this.getItemById(supplierId, itemId); // Verify item exists
    await this.itemRepository.deleteItem(supplierId, itemId);
    return `Item with ID "${itemId}" has been deleted`;
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
