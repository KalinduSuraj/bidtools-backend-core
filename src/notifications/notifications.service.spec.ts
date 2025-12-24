import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { EmailsService } from '../emails/emails.service';
import { NotificationsRepository } from './notifications.repository';
import { NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let emailsService: EmailsService;
  let repository: NotificationsRepository;

  const mockEmailsService = {
    createEmail: jest.fn(),
  };

  const mockNotificationsRepository = {
    saveNotification: jest.fn(),
    getAllNotification: jest.fn(),
    getNotificationById: jest.fn(),
    updateNotification: jest.fn(),
    deleteNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: EmailsService,
          useValue: mockEmailsService,
        },
        {
          provide: NotificationsRepository,
          useValue: mockNotificationsRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    emailsService = module.get<EmailsService>(EmailsService);
    repository = module.get<NotificationsRepository>(NotificationsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification and send email', async () => {
      const dto: CreateNotificationDto = {
        message: 'Test message',
        targetEmail: 'test@example.com',
      };

      await service.createNotification(dto);

      expect(repository.saveNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test message',
          user_id: expect.any(String),
          is_read: false,
        }),
      );
      expect(emailsService.createEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'New Notification Received',
        }),
      );
    });
  });

  describe('getAllNotification', () => {
    it('should return an array of notifications', async () => {
      const result: Notification[] = [];
      mockNotificationsRepository.getAllNotification.mockResolvedValue(result);

      expect(await service.getAllNotification()).toBe(result);
      expect(repository.getAllNotification).toHaveBeenCalled();
    });
  });

  describe('getNotificationById', () => {
    it('should return a notification if found', async () => {
      const result: Notification = { notification_id: '1' } as any;
      mockNotificationsRepository.getNotificationById.mockResolvedValue(result);

      expect(await service.getNotificationById('1')).toBe(result);
    });

    it('should throw NotFoundException if not found', async () => {
      mockNotificationsRepository.getNotificationById.mockResolvedValue(null);

      await expect(service.getNotificationById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateNotification', () => {
    it('should update and return the notification', async () => {
      const existing: Notification = {
        notification_id: '1',
        is_read: false,
      } as any;
      mockNotificationsRepository.getNotificationById.mockResolvedValue(
        existing,
      );

      const result = await service.updateNotification('1');

      expect(result.is_read).toBe(true);
      expect(repository.updateNotification).toHaveBeenCalledWith(
        expect.objectContaining({ is_read: true }),
      );
    });
  });

  describe('deleteNotification', () => {
    it('should delete the notification', async () => {
      await service.deleteNotification('1');
      expect(repository.deleteNotification).toHaveBeenCalledWith('1');
    });
  });
});
