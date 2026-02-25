import { Injectable } from '@nestjs/common';

import { CreateUserNotificationDto } from './dto/create-user-notification.dto';
import { NotificationsRepository } from './notifications.repository';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  /**
   * Create a notification for a specific user (PK = USER#<userId>, SK = NOTIFICATION#<ts>)
   */
  async createUserNotification(createDto: CreateUserNotificationDto) {
    const { user_id, type, message, is_read } = createDto;

    const res = await this.notificationsRepository.saveNotificationForUser(
      user_id,
      {
        type,
        message,
        is_read,
      },
    );

    return {
      PK: res.PK,
      SK: res.SK,
      type,
      message,
      is_read: is_read ?? false,
    } as Partial<Notification>;
  }

  /**
   * Get all notifications for a given user.
   */
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.getNotificationsByUser(userId);
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCountForUser(userId: string): Promise<number> {
    return this.notificationsRepository.getUnreadCountForUser(userId);
  }

  /**
   * Mark a notification as read for a user (identified by SK).
   */
  async markNotificationAsRead(userId: string, sk: string): Promise<void> {
    await this.notificationsRepository.markNotificationAsRead(userId, sk);
  }
}
