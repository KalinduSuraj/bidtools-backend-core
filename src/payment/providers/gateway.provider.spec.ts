import { Test, TestingModule } from '@nestjs/testing';
import { GatewayProvider } from './gateway.provider';

describe('GatewayProvider', () => {
  let provider: GatewayProvider;

  beforeEach(async () => {
    process.env.PAYHERE_MERCHANT_ID = 'test_merchant_id';
    process.env.PAYHERE_SECRET = 'test_secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [GatewayProvider],
    }).compile();

    provider = module.get<GatewayProvider>(GatewayProvider);
  });

  afterEach(() => {
    delete process.env.PAYHERE_MERCHANT_ID;
    delete process.env.PAYHERE_SECRET;
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('generateHash', () => {
    it('should generate a valid hash', () => {
      const orderId = '123';
      const amount = 1000;
      const currency = 'LKR';

      const hash = provider.generateHash(orderId, amount, currency);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('validatePayment', () => {
    it('should return true for valid hash and status code 2', () => {
      const orderId = '123';
      const amount = 1000.0;
      const currency = 'LKR';
      const statusCode = '2';

      // Generate expected hash manually to simulate external source
      const secret = process.env.PAYHERE_SECRET!;
      const merchantId = process.env.PAYHERE_MERCHANT_ID!;
      const crypto = require('crypto');

      const hashedSecret = crypto
        .createHash('md5')
        .update(secret)
        .digest('hex')
        .toUpperCase();

      const hashString = `${merchantId}${orderId}${amount.toFixed(2)}${currency}${statusCode}${hashedSecret}`;
      const md5sig = crypto
        .createHash('md5')
        .update(hashString)
        .digest('hex')
        .toUpperCase();

      const data = {
        merchant_id: merchantId,
        order_id: orderId,
        payhere_amount: amount.toFixed(2),
        payhere_currency: currency,
        status_code: statusCode,
        md5sig: md5sig,
      };

      const isValid = provider.validatePayment(data);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid hash', () => {
      const data = {
        merchant_id: 'test_merchant_id',
        order_id: '123',
        payhere_amount: 1000,
        payhere_currency: 'LKR',
        status_code: '2',
        md5sig: 'invalid_hash',
      };

      const isValid = provider.validatePayment(data);
      expect(isValid).toBe(false);
    });

    it('should return false if status code is not 2 even if hash is valid', () => {
      // Technically validatePayment checks hash AND status code??
      // Let's check the code:
      // return (bufferLocal.length === bufferRemote.length && crypto.timingSafeEqual(bufferLocal, bufferRemote) && status_code == '2');
      // Yes, it checks status_code == '2'.

      const orderId = '123';
      const amount = 1000.0;
      const currency = 'LKR';
      const statusCode = '-2';

      const secret = process.env.PAYHERE_SECRET!;
      const merchantId = process.env.PAYHERE_MERCHANT_ID!;
      const crypto = require('crypto');

      const hashedSecret = crypto
        .createHash('md5')
        .update(secret)
        .digest('hex')
        .toUpperCase();

      const hashString = `${merchantId}${orderId}${amount.toFixed(2)}${currency}${statusCode}${hashedSecret}`;
      const md5sig = crypto
        .createHash('md5')
        .update(hashString)
        .digest('hex')
        .toUpperCase();

      const data = {
        merchant_id: merchantId,
        order_id: orderId,
        payhere_amount: amount.toFixed(2),
        payhere_currency: currency,
        status_code: statusCode,
        md5sig: md5sig,
      };

      const isValid = provider.validatePayment(data);
      expect(isValid).toBe(false);
    });
  });
});
