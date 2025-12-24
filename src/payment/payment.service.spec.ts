import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { GatewayProvider } from './providers/gateway.provider';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Payment } from './entities/payment.entity';
import { UpdatePaymentDto } from './dto/update-payment.dto';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: Partial<Record<keyof PaymentRepository, jest.Mock>>;
  let gatewayProvider: Partial<Record<keyof GatewayProvider, jest.Mock>>;

  beforeEach(async () => {
    paymentRepository = {
      savePayment: jest.fn(),
      getAllPayments: jest.fn(),
      getPaymentById: jest.fn(),
      updatePaymentDetails: jest.fn(),
      deletePayment: jest.fn(),
    };

    gatewayProvider = {
      generateHash: jest.fn(),
      validatePayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PaymentRepository,
          useValue: paymentRepository,
        },
        {
          provide: GatewayProvider,
          useValue: gatewayProvider,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('placePayment', () => {
    it('should save payment and return redirect HTML', async () => {
      const dto: CreatePaymentDto = {
        rental_id: 1,
        amount: 1000,
        currency: 'LKR',
        payment_method: 'PAYHERE',
      };
      const hash = 'generated_hash';
      gatewayProvider.generateHash!.mockReturnValue(hash);

      const result = await service.placePayment(dto);

      expect(paymentRepository.savePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          rental_id: 1,
          amount: 1000,
          status: 'PENDING',
        }),
      );
      expect(gatewayProvider.generateHash).toHaveBeenCalled();
      expect(result).toContain('<html>');
      expect(result).toContain(hash);
    });
  });

  describe('getAllPayments', () => {
    it('should return all payments', async () => {
      const payments = [{ payment_id: '1' }] as Payment[];
      paymentRepository.getAllPayments!.mockResolvedValue(payments);

      const result = await service.getAllPayments();

      expect(result).toEqual(payments);
    });
  });

  describe('getPaymentById', () => {
    it('should return payment if found', async () => {
      const payment = { payment_id: '1' } as Payment;
      paymentRepository.getPaymentById!.mockResolvedValue(payment);

      const result = await service.getPaymentById('1');

      expect(result).toEqual(payment);
    });

    it('should throw NotFoundException if not found', async () => {
      paymentRepository.getPaymentById!.mockResolvedValue(null);

      await expect(service.getPaymentById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePaymentDetails', () => {
    it('should update and return payment', async () => {
      const existing = { payment_id: '1', status: 'PENDING' } as Payment;
      const dto: UpdatePaymentDto = { status: 'SUCCESS' };
      const updated = { ...existing, ...dto };

      paymentRepository.getPaymentById!.mockResolvedValue(existing);

      const result = await service.updatePaymentDetails('1', dto);

      expect(paymentRepository.updatePaymentDetails).toHaveBeenCalledWith(
        expect.objectContaining(dto),
      );
      expect(result).toEqual(expect.objectContaining(dto));
    });
  });

  describe('processNotification', () => {
    it('should throw BadRequestException if signature is invalid', async () => {
      gatewayProvider.validatePayment!.mockReturnValue(false);
      const data = { order_id: '1' };

      await expect(service.processNotification(data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update payment status to SUCCESS if status_code is 2', async () => {
      gatewayProvider.validatePayment!.mockReturnValue(true);
      const data = { order_id: '1', status_code: '2' };
      const payment = { payment_id: '1', status: 'PENDING' } as Payment;

      paymentRepository.getPaymentById!.mockResolvedValue(payment);

      await service.processNotification(data);

      expect(payment.status).toBe('SUCCESS');
      expect(paymentRepository.updatePaymentDetails).toHaveBeenCalledWith(
        payment,
      );
    });

    it('should update payment status to FAILED if status_code is not 2', async () => {
      gatewayProvider.validatePayment!.mockReturnValue(true);
      const data = { order_id: '1', status_code: '-2' };
      const payment = { payment_id: '1', status: 'PENDING' } as Payment;

      paymentRepository.getPaymentById!.mockResolvedValue(payment);

      await service.processNotification(data);

      expect(payment.status).toBe('FAILED');
      expect(paymentRepository.updatePaymentDetails).toHaveBeenCalledWith(
        payment,
      );
    });

    it('should log error and return if payment not found', async () => {
      gatewayProvider.validatePayment!.mockReturnValue(true);
      const data = { order_id: '1', status_code: '2' };

      paymentRepository.getPaymentById!.mockResolvedValue(null);

      // Should not throw
      await service.processNotification(data);

      expect(paymentRepository.updatePaymentDetails).not.toHaveBeenCalled();
    });
  });

  describe('deletePayment', () => {
    it('should call deletePayment in repository', async () => {
      await service.deletePayment('1');
      expect(paymentRepository.deletePayment).toHaveBeenCalledWith('1');
    });
  });
});
