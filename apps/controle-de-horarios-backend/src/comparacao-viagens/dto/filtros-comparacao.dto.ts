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
  @IsBoolean()
  sentidoCompativel?: boolean;

  @IsOptional()
  @IsBoolean()
  horarioCompativel?: boolean;

  @IsOptional()
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

// src/comparacao-viagens/dto/resultado-comparacao.dto.ts
export class ResultadoComparacaoDto {
  totalComparacoes: number;
  compativeis: number;
  divergentes: number;
  apenasTransdata: number;
  apenasGlobus: number;
  horarioDivergente: number;
  percentualCompatibilidade: number;
  linhasAnalisadas: number;
  tempoProcessamento: string;
}