import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ConfirmPasswordDto } from './dto/confirm-password.dto';
import { ResendCodeDto } from './dto/resend-code.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(@Body() verifyDto: VerifyDto) {
    return this.authService.verify(verifyDto);
  }

  @Post('verify/resend')
  @HttpCode(HttpStatus.OK)
  resendVerificationCode(@Body() resendCodeDto: ResendCodeDto) {
    return this.authService.resendVerificationCode(resendCodeDto);
  }

  @Post('admin/confirm')
  @HttpCode(HttpStatus.OK)
  adminConfirmUser(@Body('email') email: string) {
    return this.authService.adminConfirmUser(email);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Headers('authorization') authHeader: string) {
    // Extract the access token from "Bearer <token>"
    const accessToken = authHeader?.replace('Bearer ', '') || '';
    return this.authService.logout(accessToken);
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('password/reset/request')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('password/reset/confirm')
  @HttpCode(HttpStatus.OK)
  confirmPassword(@Body() confirmPasswordDto: ConfirmPasswordDto) {
    return this.authService.confirmPassword(confirmPasswordDto);
  }
}
