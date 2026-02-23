import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseUUIDPipe,
  Header,
  HttpCode,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @Header('Content-Type', 'text/html')
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.placePayment(createPaymentDto);
  }

  @Post('notify')
  @HttpCode(200)
  async notify(@Body() data: any) {
    await this.paymentService.processNotification(data);
    return 'OK';
  }

  @Get('success')
  success() {
    return 'Payment Successful! You can close this window.';
  }

  @Get('cancel')
  cancel() {
    return 'Payment Canceled. You can close this window.';
  }

  @Get()
  findAll() {
    return this.paymentService.getAllPayments();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.getPaymentById(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentService.updatePaymentDetails(id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.deletePayment(id);
  }

  //payments/rentalId/{rentalId} get
  //payments/rentalId/{rentalId} post   these 2 was future implementation
}
