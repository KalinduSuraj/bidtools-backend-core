import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();

  // ── Swagger / OpenAPI ──
  const config = new DocumentBuilder()
    .setTitle('BidTools API')
    .setDescription(
      'BidTools Backend Core — Job bidding platform API with auction microservice integration, ' +
      'payments, notifications, item management, rentals, and user management.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addTag('Auth', 'User registration, login, verification, and password management')
    .addTag('Users', 'User CRUD operations (admin)')
    .addTag('Profiles', 'Profile management for contractors, suppliers, and admins')
    .addTag('Jobs', 'Job creation, search, and contractor management')
    .addTag('Bidding', 'Auction lifecycle — create auctions, place bids, SSE streaming, webhooks')
    .addTag('Items', 'Inventory item management for suppliers')
    .addTag('Rentals', 'Equipment rental management')
    .addTag('Payments', 'Payment processing via PayHere gateway')
    .addTag('Notifications', 'Push notification management')
    .addTag('Files', 'File upload/download via S3')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
