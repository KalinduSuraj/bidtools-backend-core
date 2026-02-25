import { Controller, Post, Body } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { CreateEmailDto } from './dto/create-email.dto';

@Controller('email')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post()
  async sendEmail(@Body() createEmailDto: CreateEmailDto) {
    return this.emailsService.createEmail(createEmailDto);
  }
}
