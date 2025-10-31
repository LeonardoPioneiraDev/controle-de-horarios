// src/modules/controle-horarios/dto/salvar-controle-horarios.dto.ts

import { IsOptional, IsString, IsBoolean, IsDateString, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class SalvarControleHorariosDto {
  @IsString()
  viagemGlobusId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  numeroCarro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  nomeMotoristaEditado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  crachaMotoristaEditado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  nomeCobradorEditado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  crachaCobradorEditado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => value?.trim())
  observacoes?: string;

  @ApiProperty({ description: 'Indica se o registro está ativo', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isAtivo?: boolean = true;

  @ApiProperty({ description: 'ID do usuário que editou o registro', required: false })
  @IsOptional()
  @IsString()
  editorId?: string;

  @ApiProperty({ description: 'Nome do usuário que editou o registro', required: false })
  @IsOptional()
  @IsString()
  editorNome?: string;

  @ApiProperty({ description: 'Email do usuário que editou o registro', required: false })
  @IsOptional()
  @IsString()
  editorEmail?: string;
}

export class SalvarMultiplosControleHorariosDto {
  @IsString()
  dataReferencia: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalvarControleHorariosDto)
  controles: SalvarControleHorariosDto[];
}