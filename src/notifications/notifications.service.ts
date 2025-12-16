import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';

import { Notification } from './entities/notification.entity';
import { EmailsService } from 'src/emails/emails.service';
import { NotificationsRepository } from './notifications.repository';
@Injectable()
export class NotificationsService {
  private notifications: Notification[] = [];

  constructor(
    private readonly emailsService: EmailsService,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  //done for now
  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const newNotification: Notification = {
      ...createNotificationDto,
      is_read: false,
      created_at: new Date(),
    };
    await this.notificationsRepository.saveNotification(newNotification);
    await this.emailsService.createEmail({
      to: 'mchanuka72@gmail.com', // need to get for specific user
      subject: 'New Notification Received',
      body: `You have a new notification: ${createNotificationDto.content || 'No content'}`,
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
