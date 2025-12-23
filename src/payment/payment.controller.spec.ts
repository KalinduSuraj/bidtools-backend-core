import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';

describe('PaymentController', () => {
  let controller: PaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        PaymentService,
        {
          provide: PaymentRepository,
          useValue: {
            getAllPayments: jest.fn(),
            getPaymentById: jest.fn(),
            updatePaymentDetails: jest.fn(),
            deletePayment: jest.fn(),
            placePayment: jest.fn(), // Assuming this method might exist or called, added to be safe
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
