import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';
import { EmailsService } from 'src/emails/emails.service';
@Injectable()
export class NotificationsService {
  private notifications: Notification[] = [];

  constructor(private readonly emailsService: EmailsService) {}

  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const newNotification: Notification = {
      ...createNotificationDto,
    };
    this.notifications.push(newNotification);

    await this.emailsService.createEmail({
      to: 'mchanuka72@gmail.com',
      subject: 'New Notification Received',
      body: `You have a new notification: ${createNotificationDto.message || 'No content'}`,
      from: process.env.FROM_EMAIL || 'noreply@bidtools.com',
    });
    return newNotification;
  }

  async getAllNotification(): Promise<Notification[]> {
    return this.notifications;
  }

  async getNotificationById(id: string): Promise<Notification> {
    const notification = this.notifications.find(
      (notification) => notification.id === id,
    );
    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }
    return notification;
  }

  async updateNotification(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.getNotificationById(id);
    const update = { ...notification, ...updateNotificationDto, id };
    const index = this.notifications.findIndex(
      (notification) => notification.id === id,
    );
    this.notifications[index] = update;
    return update;
  }

  async deleteNotification(id: string): Promise<string> {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    this.notifications.splice(index, 1);
    return 'Notification Removed';
  }
}
