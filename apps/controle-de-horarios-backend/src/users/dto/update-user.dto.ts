import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsDate, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { UserRole, UserStatus } from '@/common/enums';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emailVerificationToken?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  passwordResetToken?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  passwordResetExpires?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  lastLogin?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  loginAttempts?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  lockedUntil?: Date;
}