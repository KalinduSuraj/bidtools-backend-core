import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class FileKeyDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9_./-]+$/, {
    message: 'Key contains invalid characters',
  })
  key: string;
}
