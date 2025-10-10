import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123def456',
    description: 'Token de reset de senha',
  })
  @IsString({ message: 'Token deve ser uma string' })
  token: string;

  @ApiProperty({
    example: 'novaSenha@123',
    description: 'Nova senha do usuário',
    minLength: 8,
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  newPassword: string;
}