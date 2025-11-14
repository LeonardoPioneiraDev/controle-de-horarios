import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsIn, MaxLength } from 'class-validator';
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

  // Motivo do atraso e observação livre
  @ApiProperty({ description: 'Motivo do atraso (pré-definido)', required: false, enum: ['ENGARRAFAMENTO', 'ACIDENTE', 'QUEBRA_OU_DEFEITO', 'DIVERSOS'] })
  @IsOptional()
  @IsString()
  @IsIn(['ENGARRAFAMENTO', 'ACIDENTE', 'QUEBRA_OU_DEFEITO', 'DIVERSOS'])
  atraso_motivo?: string;

  @ApiProperty({ description: 'Observação livre do atraso', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  atraso_observacao?: string;

  // Horários ajustados e aprovação
  @ApiProperty({ description: 'Horário de saída ajustado (HH:MM ou ISO)', required: false })
  @IsOptional()
  @IsString()
  hor_saida_ajustada?: string;

  @ApiProperty({ description: 'Horário de chegada ajustado (HH:MM ou ISO)', required: false })
  @IsOptional()
  @IsString()
  hor_chegada_ajustada?: string;

  @ApiProperty({ description: 'Viagem está de acordo (aprovada)', required: false })
  @IsOptional()
  de_acordo?: boolean;
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
