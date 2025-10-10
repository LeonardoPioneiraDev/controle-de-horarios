import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'abc123def456',
    description: 'Token de verificação de e-mail',
  })
  @IsString({ message: 'Token deve ser uma string' })
  token: string;
}