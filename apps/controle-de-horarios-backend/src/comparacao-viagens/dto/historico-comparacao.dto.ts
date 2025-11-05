import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListarHistoricoQueryDto {
  @ApiPropertyOptional({ description: 'Data de referência (YYYY-MM-DD)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : String(value)))
  @IsString()
  data?: string;

  @ApiPropertyOptional({ description: 'Data inicial (YYYY-MM-DD)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : String(value)))
  @IsString()
  dataInicial?: string;

  @ApiPropertyOptional({ description: 'Data final (YYYY-MM-DD)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : String(value)))
  @IsString()
  dataFinal?: string;

  @ApiPropertyOptional({ description: 'E-mail do executor (filtro parcial)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : String(value)))
  @IsString()
  executedByEmail?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value == null) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value == null) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class HistoricoComparacaoResumoDto {
  @IsUUID()
  id: string;

  @IsString()
  dataReferencia: string;

  @IsInt()
  totalComparacoes: number;
  @IsInt()
  compativeis: number;
  @IsInt()
  divergentes: number;
  @IsInt()
  apenasTransdata: number;
  @IsInt()
  apenasGlobus: number;
  @IsInt()
  horarioDivergente: number;

  @IsString()
  percentualCompatibilidade: string; // pg numeric

  @IsInt()
  linhasAnalisadas: number;

  @IsString()
  tempoProcessamento: string;

  @IsInt()
  durationMs: number;

  @IsString()
  executedByEmail: string | null;
}

