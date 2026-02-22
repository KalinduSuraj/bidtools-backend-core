import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GlobalSignOutCommand,
  AdminAddUserToGroupCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ConfirmPasswordDto } from './dto/confirm-password.dto';
import { UsersService } from '../users';
import { ResendCodeDto } from './dto/resend-code.dto';

@Injectable()
export class AuthService {
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly clientId: string;
  private readonly userPoolId: string;
  private readonly clientSecret: string | undefined;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const region =
      this.configService.get<string>('COGNITO_REGION') ||
      this.configService.get<string>('AWS_REGION') ||
      'us-east-1';

    this.clientId = this.configService.get<string>('COGNITO_CLIENT_ID') as string;
    this.userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID') as string;
    this.clientSecret = this.configService.get<string>('COGNITO_CLIENT_SECRET');

    this.logger.debug(`Cognito Client ID: ${this.clientId}`);
    this.logger.debug(`Cognito User Pool ID: ${this.userPoolId}`);

    if (this.clientSecret) {
      if (this.clientSecret === 'PASTE_YOUR_CLIENT_SECRET_HERE') {
        this.logger.error('!!! CRITICAL ERROR: YOUR COGNITO_CLIENT_SECRET IN .env IS STILL A PLACEHOLDER !!!');
        this.logger.error('Registration and login will fail until you provide the REAL secret from the AWS Console.');
      } else {
        this.logger.debug('Cognito Client Secret detected');
      }
    }

    if (!this.clientId || !this.userPoolId) {
      throw new Error(
        'Cognito configuration is missing! Check COGNITO_CLIENT_ID and COGNITO_USER_POOL_ID in your .env file.',
      );
    }

    this.cognitoClient = new CognitoIdentityProviderClient({
      region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        )!,
      },
    });
  }

  /**
   * Calculates the SECRET_HASH required for Cognito App Clients with a secret enabled.
   */
  private calculateSecretHash(username: string): string | undefined {
    if (!this.clientSecret) return undefined;

    return crypto
      .createHmac('SHA256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  /**
   * Register a new user in Cognito and create a DynamoDB user record.
   */
  async register(registerDto: RegisterDto) {
    const { name, email, password, role, phone } = registerDto;

    try {
      // 1. Sign up in Cognito
      // Use a UUID as the Cognito username because the user pool is configured
      // with email as an alias (email cannot be used as the Username directly).
      const cognitoUsername = randomUUID();

      const signUpCommand = new SignUpCommand({
        ClientId: this.clientId,
        SecretHash: this.calculateSecretHash(cognitoUsername),
        Username: cognitoUsername,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name },
          ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
        ],
      });

      const signUpResult = await this.cognitoClient.send(signUpCommand);
      const cognitoSub = signUpResult.UserSub!;

      // 2. Add user to Cognito group (role-based)
      try {
        const addToGroupCommand = new AdminAddUserToGroupCommand({
          UserPoolId: this.userPoolId,
          Username: cognitoUsername,
          GroupName: role,
        });
        await this.cognitoClient.send(addToGroupCommand);
      } catch (groupError) {
        this.logger.warn(
          `Could not add user to group "${role}". Ensure the group exists in Cognito. Error: ${groupError}`,
        );
      }

      // 3. Create user record in DynamoDB
      const user = await this.usersService.createUser({
        user_id: cognitoSub,
        name,
        email,
        role,
        phone,
        status: 'pending_verification',
      });

      return {
        message: 'User registered successfully. Please verify your email.',
        user,
      };
    } catch (error: any) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);

      if (error.message.includes('configured with secret but SECRET_HASH was not received')) {
        throw new InternalServerErrorException(
          'Cognito Client Secret is missing! Please add COGNITO_CLIENT_SECRET to your .env file and restart the server.',
        );
      }

      if (error.name === 'UsernameExistsException') {
        throw new BadRequestException('A user with this email already exists');
      }
      if (error.name === 'InvalidPasswordException') {
        throw new BadRequestException(
          'Password does not meet requirements: minimum 8 characters',
        );
      }
      throw new InternalServerErrorException(
        `Registration failed: ${error.message}`,
      );
    }
  }

  /**
   * Authenticate user via Cognito USER_PASSWORD_AUTH flow.
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: this.calculateSecretHash(email) as string,
        },
      });

      const result = await this.cognitoClient.send(command);
      const authResult = result.AuthenticationResult;

      if (!authResult) {
        throw new UnauthorizedException('Authentication failed');
      }

      // Fetch the user record from DynamoDB
      let user: any = null;
      try {
        const users = await this.usersService.findAll();
        user = users.find((u) => u.email === email) || null;
      } catch {
        // User record may not exist in DynamoDB yet
      }

      return {
        access_token: authResult.AccessToken,
        refresh_token: authResult.RefreshToken,
        id_token: authResult.IdToken,
        expires_in: authResult.ExpiresIn,
        user,
      };
    } catch (error: any) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      if (
        error.name === 'NotAuthorizedException' ||
        error.name === 'UserNotFoundException'
      ) {
        throw new UnauthorizedException('Invalid email or password');
      }
      if (error.name === 'UserNotConfirmedException') {
        throw new BadRequestException(
          'User is not verified. Please confirm your email first.',
        );
      }
      throw new InternalServerErrorException(
        `Login failed: ${error.message}`,
      );
    }
  }

  /**
   * Verify user email with OTP/confirmation code.
   */
  async verify(verifyDto: VerifyDto) {
    const { email, otp } = verifyDto;

    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        SecretHash: this.calculateSecretHash(email),
        Username: email,
        ConfirmationCode: otp,
      });

      await this.cognitoClient.send(command);

      // Update user status in DynamoDB
      try {
        const users = await this.usersService.findAll();
        const user = users.find((u) => u.email === email);
        if (user) {
          await this.usersService.update(user.user_id, { status: 'active' });
        }
      } catch {
        this.logger.warn('Could not update user status after verification');
      }

      return { message: 'Email verified successfully' };
    } catch (error: any) {
      this.logger.error(`Verification failed: ${error.message}`, error.stack);
      if (error.name === 'CodeMismatchException') {
        throw new BadRequestException('Invalid verification code');
      }
      if (error.name === 'ExpiredCodeException') {
        throw new BadRequestException(
          'Verification code has expired. Please request a new one.',
        );
      }
      throw new InternalServerErrorException(
        `Verification failed: ${error.message}`,
      );
    }
  }

  /**
   * Resend the email verification code.
   */
  async resendVerificationCode(resendCodeDto: ResendCodeDto) {
    const { email } = resendCodeDto;

    try {
      // Look up the Cognito username from DynamoDB (we stored user_id = cognitoSub)
      // For alias-based pools, we can use the email directly with ResendConfirmationCode
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        SecretHash: this.calculateSecretHash(email),
        Username: email,
      });

      this.logger.debug(`Resending verification code for email: ${email}`);
      this.logger.debug(`Using ClientId: ${this.clientId}`);
      const result = await this.cognitoClient.send(command);
      this.logger.debug(`Resend result: ${JSON.stringify(result)}`);
      return { message: 'Verification code resent successfully. Please check your email.' };
    } catch (error: any) {
      this.logger.error(`Resend code failed: ${error.message}`, error.stack);
      if (error.name === 'UserNotFoundException') {
        throw new BadRequestException('No account found with this email');
      }
      if (error.name === 'InvalidParameterException') {
        throw new BadRequestException('User is already verified');
      }
      throw new InternalServerErrorException(
        `Failed to resend verification code: ${error.message}`,
      );
    }
  }

  /**
   * Logout user by invalidating all tokens via GlobalSignOut.
   */
  async logout(accessToken: string) {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      await this.cognitoClient.send(command);
      return { message: 'Logged out successfully' };
    } catch (error: any) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Logout failed: ${error.message}`,
      );
    }
  }

  /**
   * Refresh the access token using a valid refresh token.
   * Note: If a secret is used, we need the username/sub to calculate the SECRET_HASH.
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refresh_token } = refreshTokenDto;

    try {
      // For refresh token, the username is typically the 'sub' or the actual username.
      // Since we don't have it in the DTO, we might need a separate service call or pass it from the client.
      // For now, let's assume 'dummy' won't work if secret is enabled.
      // We should ideally pass the username or extract it from the token (though it's expired).

      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refresh_token,
          ...(this.clientSecret ? { SECRET_HASH: this.calculateSecretHash('') as string } : {}), // Often not needed for refresh if sub is in token, but depends on Cognito config
        },
      });

      const result = await this.cognitoClient.send(command);
      const authResult = result.AuthenticationResult;

      if (!authResult) {
        throw new UnauthorizedException('Token refresh failed');
      }

      return {
        access_token: authResult.AccessToken,
        id_token: authResult.IdToken,
        expires_in: authResult.ExpiresIn,
      };
    } catch (error: any) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Request a password reset — sends a verification code to the user's email.
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        SecretHash: this.calculateSecretHash(email),
        Username: email,
      });

      await this.cognitoClient.send(command);
      return { message: 'Password reset code sent to your email' };
    } catch (error: any) {
      this.logger.error(
        `Forgot password failed: ${error.message}`,
        error.stack,
      );
      if (error.name === 'UserNotFoundException') {
        // Don't reveal whether user exists — return success anyway
        return { message: 'Password reset code sent to your email' };
      }
      throw new InternalServerErrorException(
        `Password reset request failed: ${error.message}`,
      );
    }
  }

  /**
   * Confirm password reset with OTP and new password.
   */
  async confirmPassword(confirmPasswordDto: ConfirmPasswordDto) {
    const { email, otp, new_password } = confirmPasswordDto;

    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        SecretHash: this.calculateSecretHash(email),
        Username: email,
        ConfirmationCode: otp,
        Password: new_password,
      });

      await this.cognitoClient.send(command);
      return { message: 'Password reset successfully' };
    } catch (error: any) {
      this.logger.error(
        `Password reset confirm failed: ${error.message}`,
        error.stack,
      );
      if (error.name === 'CodeMismatchException') {
        throw new BadRequestException('Invalid reset code');
      }
      if (error.name === 'ExpiredCodeException') {
        throw new BadRequestException('Reset code has expired');
      }
      throw new InternalServerErrorException(
        `Password reset failed: ${error.message}`,
      );
    }
  }
}
