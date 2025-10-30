// src/modules/controle-horarios/dto/salvar-controle-horarios.dto.ts

import { IsString, IsOptional, IsUUID, MaxLength, IsArray, ValidateNested } from 'class-validator';
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
  informacaoRecolhe?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  observacoes?: string;
}

export class SalvarMultiplosControleHorariosDto {
  @IsString()
  dataReferencia: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalvarControleHorariosDto)
  controles: SalvarControleHorariosDto[];
}