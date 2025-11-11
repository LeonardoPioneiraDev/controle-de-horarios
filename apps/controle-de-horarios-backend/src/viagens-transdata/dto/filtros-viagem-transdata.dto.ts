// src/viagens-transdata/dto/filtros-viagem-transdata.dto.ts

import { IsOptional, IsString, IsNumber, IsIn, IsDateString, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FiltrosViagemTransdataDto {
  @ApiPropertyOptional({ 
    description: 'Código da linha extraído do NomeLinha (apenas números dos primeiros 7 caracteres)', 
    example: '1800' 
  })
  @IsOptional()
  @IsString()
  codigoLinha?: string;

  @ApiPropertyOptional({ 
    description: 'Número do serviço', 
    example: 38 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  servico?: number;

  @ApiPropertyOptional({ 
    description: 'Sentido da viagem', 
    enum: ['IDA', 'VOLTA'] 
  })
  @IsOptional()
  @IsIn(['IDA', 'VOLTA'])
  sentido?: string;

  @ApiPropertyOptional({ 
    description: 'Tipo de ponto final', 
    enum: ['Manual', 'Automático'] 
  })
  @IsOptional()
  @IsIn(['Manual', 'Automático'])
  pontoFinal?: string;

  @ApiPropertyOptional({ 
    description: 'Status de cumprimento', 
    enum: ['CUMPRIDA', 'NAO_CUMPRIDA', 'PARCIALMENTE_CUMPRIDA', 'PENDENTE'] 
  })
  @IsOptional()
  @IsIn(['CUMPRIDA', 'NAO_CUMPRIDA', 'PARCIALMENTE_CUMPRIDA', 'PENDENTE'])
  statusCumprimento?: string;

  @ApiPropertyOptional({ 
    description: 'Horário de início (HH:mm)', 
    example: '06:00' 
  })
  @IsOptional()
  @IsString()
  horarioInicio?: string;

  @ApiPropertyOptional({ 
    description: 'Horário de fim (HH:mm)', 
    example: '22:00' 
  })
  @IsOptional()
  @IsString()
  horarioFim?: string;

  @ApiPropertyOptional({ 
    description: 'Nome da linha (busca parcial)', 
    example: 'São Sebastião' 
  })
  @IsOptional()
  @IsString()
  nomeLinha?: string;

  @ApiPropertyOptional({ description: 'Prefixo do veículo realizado (busca parcial)' })
  @IsOptional()
  @IsString()
  prefixoRealizado?: string;

  @ApiPropertyOptional({ description: 'Nome do motorista (busca parcial)' })
  @IsOptional()
  @IsString()
  nomeMotorista?: string;

  @ApiPropertyOptional({ description: 'Filtrar somente viagens atrasadas' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  somenteAtrasados?: boolean;

  @ApiPropertyOptional({ 
    description: 'Página (paginação)', 
    example: 1, 
    default: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Itens por página', 
    example: 50, 
    default: 50 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 50;
}