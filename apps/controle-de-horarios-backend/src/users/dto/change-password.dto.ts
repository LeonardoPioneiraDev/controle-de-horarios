import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'senhaAtual123',
    description: 'Senha atual do usuário',
  })
  @IsString({ message: 'Senha atual deve ser uma string' })
  currentPassword: string;

  @ApiProperty({
    example: 'novaSenha@123',
    description: 'Nova senha do usuário',
    minLength: 8,
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  newPassword: string;
}