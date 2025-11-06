import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SingleControleHorarioUpdateDto {
  @ApiProperty({ description: 'ID do registro de controle de horário a ser atualizado' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Prefixo do veículo (número do carro)', required: false })
  @IsOptional()
  @IsString()
  prefixo_veiculo?: string;

  @ApiProperty({ description: 'Nome do motorista substituto', required: false })
  @IsOptional()
  @IsString()
  motorista_substituto_nome?: string;

  @ApiProperty({ description: 'Crachá do motorista substituto', required: false })
  @IsOptional()
  @IsString()
  motorista_substituto_cracha?: string;

  @ApiProperty({ description: 'Nome do cobrador substituto', required: false })
  @IsOptional()
  @IsString()
  cobrador_substituto_nome?: string;

  @ApiProperty({ description: 'Crachá do cobrador substituto', required: false })
  @IsOptional()
  @IsString()
  cobrador_substituto_cracha?: string;

  @ApiProperty({ description: 'Observações da edição', required: false })
  @IsOptional()
  @IsString()
  observacoes_edicao?: string;
}

export class UpdateMultipleControleHorariosDto {
  @ApiProperty({ type: [SingleControleHorarioUpdateDto], description: 'Lista de atualizações para registros de controle de horário' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleControleHorarioUpdateDto)
  updates: SingleControleHorarioUpdateDto[];

  @ApiProperty({ description: 'Nome do editor', required: false })
  @IsOptional()
  @IsString()
  editorNome?: string;

  @ApiProperty({ description: 'Email do editor', required: false })
  @IsOptional()
  @IsString()
  editorEmail?: string;
}
