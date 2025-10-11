// src/comparacao-viagens/dto/filtros-comparacao.dto.ts
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
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
  @IsString()
  limite?: string = '100';
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