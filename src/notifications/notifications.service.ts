import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';

import { Notification } from './entities/notification.entity';
import { EmailsService } from '../emails/emails.service';
import { NotificationsRepository } from './notifications.repository';
import { v4 as uuid } from 'uuid';
@Injectable()
export class NotificationsService {
  constructor(
    private readonly emailsService: EmailsService,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  //done for now
  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const { targetEmail, ...notificationData } = createNotificationDto;

    const notificationId = uuid();

    const newNotification: Notification = {
      ...notificationData,
      notification_id: notificationId,
      user_id: uuid(),
      is_read: false,
      created_at: new Date().toISOString(),
    };
    await this.notificationsRepository.saveNotification(newNotification);
    await this.emailsService.createEmail({
      to: targetEmail || 'test@gmail.com',
      subject: 'New Notification Received',
      body: `You have a new notification: ${createNotificationDto.message || 'No content'}`,
      from: process.env.FROM_EMAIL || 'noreply@bidtools.com',
    });
    return newNotification;
  }

  //done for now
  async getAllNotification(): Promise<Notification[]> {
    return this.notificationsRepository.getAllNotification();
  }

  //done for now
  async getNotificationById(id: string): Promise<Notification> {
    const notification =
      await this.notificationsRepository.getNotificationById(id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }
    return notification;
  }

  //done for now
  async updateNotification(id: string): Promise<Notification> {
    const notification = await this.getNotificationById(id);

    const updatedNotification = {
      ...notification,
      is_read: true,
      notification_id: id,
    } as Notification;

    await this.notificationsRepository.updateNotification(updatedNotification);

    return updatedNotification;
  }

  //done for now
  async deleteNotification(id: string): Promise<string> {
    await this.notificationsRepository.deleteNotification(id);
    return 'Notification Removed';
  }
}
