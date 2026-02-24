import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Profiles')
@ApiBearerAuth('JWT-auth')
@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) { }

  // ----- /profiles endpoints -----

  @Get('profiles')
  @UseGuards(JwtAuthGuard)
  findAll(@Query('profile_type') profileType?: string) {
    return this.profilesService.findAll(profileType);
  }

  @Get('profiles/user/:userId')
  @UseGuards(JwtAuthGuard)
  findByUserId(@Param('userId') userId: string) {
    return this.profilesService.findByUserId(userId);
  }

  @Post('profiles')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(createProfileDto);
  }

  @Get('profiles/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Put('profiles/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(id, updateProfileDto);
  }

  @Delete('profiles/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.profilesService.remove(id);
  }

  // ----- Admin: Verification Status -----

  @Patch('profiles/:profileId/verification-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateVerificationStatus(
    @Param('profileId') profileId: string,
    @Body('verification_status') verificationStatus: 'pending' | 'verified' | 'rejected',
  ) {
    return this.profilesService.updateVerificationStatus(profileId, verificationStatus);
  }

  // ----- /contractors/:id endpoint -----

  @Get('contractors/:id')
  @UseGuards(JwtAuthGuard)
  getContractorProfile(@Param('id') id: string) {
    return this.profilesService.getContractorProfile(id);
  }

  // ----- /suppliers/:id endpoint -----

  @Get('suppliers/:id')
  @UseGuards(JwtAuthGuard)
  getSupplierProfile(@Param('id') id: string) {
    return this.profilesService.getSupplierProfile(id);
  }

  // ----- /admins/:id endpoint -----

  @Get('admins/:id')
  @UseGuards(JwtAuthGuard)
  getAdminProfile(@Param('id') id: string) {
    return this.profilesService.getAdminProfile(id);
  }

  // ----- S3 Pre-signed URL endpoints -----

  @Post('profiles/:userId/business-license/upload-url')
  @UseGuards(JwtAuthGuard)
  getUploadUrl(
    @Param('userId') userId: string,
    @Body('fileName') fileName: string,
  ) {
    return this.profilesService.getBusinessLicenseUploadUrl(userId, fileName);
  }

  @Get('profiles/:userId/business-license/download-url')
  @UseGuards(JwtAuthGuard)
  getDownloadUrl(
    @Param('userId') userId: string,
    @Query('key') key: string,
  ) {
    return this.profilesService.getBusinessLicenseDownloadUrl(key);
  }
}
