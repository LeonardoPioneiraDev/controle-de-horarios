// src/comparacao-viagens/dto/filtros-comparacao.dto.ts
import { IsOptional, IsString, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { StatusComparacao } from '../entities/comparacao-viagem.entity';

export class FiltrosComparacaoDto {
  @IsOptional()
  @IsString()
  codigoLinha?: string;

  @IsOptional()
  @IsEnum(StatusComparacao)
  statusComparacao?: StatusComparacao;

  @IsOptional()
  @IsString()
  globusSetor?: string;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined))
  @IsBoolean()
  sentidoCompativel?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined))
  @IsBoolean()
  horarioCompativel?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined))
  @IsBoolean()
  servicoCompativel?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;
}
