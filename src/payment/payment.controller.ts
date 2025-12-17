import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.placePayment(createPaymentDto);
  }

  @Get()
  findAll() {
    return this.paymentService.getAllPayments();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.getPaymentById(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.updatePaymentDetails(+id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentService.deletePayment(+id);
  }

  //payments/rentalId/{rentalId} get
  //payments/rentalId/{rentalId} post   these 2 was future implementation
}
