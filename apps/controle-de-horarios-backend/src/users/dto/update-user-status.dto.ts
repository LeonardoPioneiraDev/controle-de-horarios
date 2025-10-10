import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@/common/enums';

export class UpdateUserStatusDto {
  @ApiProperty({
    example: 'active',
    description: 'Novo status do usuário',
    enum: UserStatus,
  })
  @IsEnum(UserStatus, { message: 'Status deve ser um valor válido' })
  status: UserStatus;
}