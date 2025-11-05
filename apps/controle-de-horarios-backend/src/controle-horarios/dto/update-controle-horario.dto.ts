import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateControleHorarioDto {
  @ApiProperty({
    description: 'ID do registro de controle de horário a ser atualizado',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: true,
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Prefixo do veículo (editável)',
    example: 'ABC-1234',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  prefixo_veiculo?: string;

  @ApiProperty({
    description: 'Nome do motorista substituto (editável)',
    example: 'João da Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  motorista_substituto_nome?: string;

  @ApiProperty({
    description: 'Crachá do motorista substituto (editável)',
    example: '12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  motorista_substituto_cracha?: string;

  @ApiProperty({
    description: 'Nome do cobrador substituto (editável)',
    example: 'Maria Souza',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cobrador_substituto_nome?: string;

  @ApiProperty({
    description: 'Crachá do cobrador substituto (editável)',
    example: '67890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  cobrador_substituto_cracha?: string;

  @ApiProperty({
    description: 'Observações sobre a edição (editável)',
    example: 'Troca de motorista devido a atestado médico.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes_edicao?: string;

  @ApiProperty({
    description: 'Nome do usuário que realizou a edição (preenchido automaticamente)',
    example: 'Admin User',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  editado_por_nome?: string;

  @ApiProperty({
    description: 'Email do usuário que realizou a edição (preenchido automaticamente)',
    example: 'admin@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  editado_por_email?: string;

  @ApiProperty({
    description: 'Status de ativação do registro (editável)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_ativo?: boolean;
}
