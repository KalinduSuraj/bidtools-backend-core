import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfilesRepository } from './profiles.repository';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { v4 as uuid } from 'uuid';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class ProfilesService {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(private readonly profilesRepository: ProfilesRepository) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'bidtools-bucket';
  }

  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    const profileId = uuid();

    const newProfile: Profile = {
      profile_id: profileId,
      user_id: createProfileDto.user_id,
      profile_type: createProfileDto.profile_type as
        | 'contractor'
        | 'supplier'
        | 'admin',
      company_name: createProfileDto.company_name,
      business_license: createProfileDto.business_license,
      address: createProfileDto.address,
      rating: createProfileDto.rating || 0,
      verification_status: createProfileDto.verification_status || 'pending',
      created_at: new Date().toISOString(),
      // Contractor-specific
      project_locations: createProfileDto.project_locations,
      // Supplier-specific
      inventory_count: createProfileDto.inventory_count,
      // Admin-specific
      permissions: createProfileDto.permissions,
    };

    await this.profilesRepository.saveProfile(newProfile);
    return newProfile;
  }

  async findAll(profileType?: string): Promise<Profile[]> {
    return this.profilesRepository.getAllProfiles(profileType);
  }

  async findOne(profileId: string): Promise<Profile> {
    const profile = await this.profilesRepository.getProfileById(profileId);
    if (!profile) {
      throw new NotFoundException(
        `Profile with ID "${profileId}" not found`,
      );
    }
    return profile;
  }

  async update(
    profileId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.findOne(profileId);

    await this.profilesRepository.updateProfile(
      profile.user_id,
      profile.profile_type,
      {
        ...updateProfileDto,
        profile_type: updateProfileDto.profile_type as any,
      },
    );

    return this.findOne(profileId);
  }

  async remove(profileId: string): Promise<void> {
    const profile = await this.findOne(profileId);
    await this.profilesRepository.deleteProfile(
      profile.user_id,
      profile.profile_type,
    );
  }

  // ----- Role-specific profile lookups -----

  async getContractorProfile(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.getProfileByUserIdAndType(
      userId,
      'contractor',
    );
    if (!profile) {
      throw new NotFoundException(
        `Contractor profile for user "${userId}" not found`,
      );
    }
    return profile;
  }

  async getSupplierProfile(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.getProfileByUserIdAndType(
      userId,
      'supplier',
    );
    if (!profile) {
      throw new NotFoundException(
        `Supplier profile for user "${userId}" not found`,
      );
    }
    return profile;
  }

  async getAdminProfile(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.getProfileByUserIdAndType(
      userId,
      'admin',
    );
    if (!profile) {
      throw new NotFoundException(
        `Admin profile for user "${userId}" not found`,
      );
    }
    return profile;
  }

  // ----- S3 Pre-signed URL generation -----

  /**
   * Generate a pre-signed URL for uploading a business license document.
   */
  async getBusinessLicenseUploadUrl(
    userId: string,
    fileName: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const key = `business-licenses/${userId}/${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: 'application/pdf',
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 3600,
    });

    return { uploadUrl, key };
  }

  /**
   * Generate a pre-signed URL for downloading/viewing a business license.
   */
  async getBusinessLicenseDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }
}
