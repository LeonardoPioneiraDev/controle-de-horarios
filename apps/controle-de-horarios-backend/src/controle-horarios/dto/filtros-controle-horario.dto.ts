// src/dto/filtros-controle-horario.dto.ts
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, Max, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SetorControleHorario {
  SANTA_MARIA = 6000,
  GAMA = 7000,
  PARANOA = 8000,
  SAO_SEBASTIAO = 9000
}

export enum SentidoControleHorario {
  IDA = 'I',
  VOLTA = 'V',
  CIRCULAR = 'C'
}

export enum OrdemOrdenacao {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FiltrosControleHorarioDto {
  @ApiPropertyOptional({ description: 'Data da viagem no formato YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  data_viagem?: string;

  @ApiPropertyOptional({ description: 'Setores (códigos numéricos) separados por vírgula', type: [Number] })
  @IsOptional()
  @Transform(({ value }) => value?.split(',').map(Number))
  @Type(() => Number)
  setores?: number[];

  @ApiPropertyOptional({ description: 'Códigos das linhas (até 20) separados por vírgula', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',').slice(0, 20)))
  codigo_linha?: string[];

  @ApiPropertyOptional({ description: 'Nome da linha (busca parcial)' })
  @IsOptional()
  @IsString()
  nome_linha?: string;

  @ApiPropertyOptional({ description: 'Sentido da viagem (I, V, C)', enum: SentidoControleHorario })
  @IsOptional()
  @IsEnum(SentidoControleHorario)
  sentido?: SentidoControleHorario;

  @ApiPropertyOptional({ description: 'Setor principal da linha (ex: GAMA)' })
  @IsOptional()
  @IsString()
  setor_principal_linha?: string;

  @ApiPropertyOptional({ description: 'Local de origem da viagem (busca parcial)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  local_origem_viagem?: string[];

  @ApiPropertyOptional({ description: 'Número do serviço (busca parcial)' })
  @IsOptional()
  @IsString()
  cod_servico_numero?: string;

  @ApiPropertyOptional({ description: 'Nome do motorista (busca parcial)' })
  @IsOptional()
  @IsString()
  nome_motorista?: string;

  @ApiPropertyOptional({ description: 'Nome do cobrador (busca parcial)' })
  @IsOptional()
  @IsString()
  nome_cobrador?: string;

  @ApiPropertyOptional({ description: 'Código da atividade (ex: 2 para REGULAR)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cod_atividade?: number;

  @ApiPropertyOptional({ description: 'Nome da atividade (ex: REGULAR)' })
  @IsOptional()
  @IsString()
  nome_atividade?: string;

  @ApiPropertyOptional({ description: 'Tipo de dia (DIAS UTEIS, SABADO, DOMINGO)' })
  @IsOptional()
  @IsString()
  desc_tipodia?: string;

  @ApiPropertyOptional({ description: 'Prefixo do veículo (busca parcial)' })
  @IsOptional()
  @IsString()
  prefixo_veiculo?: string;

  @ApiPropertyOptional({ description: 'Nome do motorista substituto (busca parcial)' })
  @IsOptional()
  @IsString()
  motorista_substituto_nome?: string;

  @ApiPropertyOptional({ description: 'Crachá do motorista substituto (busca parcial)' })
  @IsOptional()
  @IsString()
  motorista_substituto_cracha?: string;

  @ApiPropertyOptional({ description: 'Nome do cobrador substituto (busca parcial)' })
  @IsOptional()
  @IsString()
  cobrador_substituto_nome?: string;

  @ApiPropertyOptional({ description: 'Crachá do cobrador substituto (busca parcial)' })
  @IsOptional()
  @IsString()
  cobrador_substituto_cracha?: string;

  @ApiPropertyOptional({ description: 'Crachá do motorista ou cobrador para buscar a escala' })
  @IsOptional()
  @IsString()
  cracha_funcionario?: string;

  @ApiPropertyOptional({ description: 'Filtrar apenas viagens que foram editadas', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  apenas_editadas?: boolean = false;

  @ApiPropertyOptional({ description: 'Limite de resultados por página', default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10000)
  limite?: number = 1000;

  @ApiPropertyOptional({ description: 'Número da página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pagina?: number = 1;

  @ApiPropertyOptional({ description: 'Campo para ordenar os resultados', example: 'hor_saida' })
  @IsOptional()
  @IsString()
  ordenar_por?: string;

  @ApiPropertyOptional({ description: 'Ordem da ordenação (ASC ou DESC)', enum: OrdemOrdenacao, example: 'ASC' })
  @IsOptional()
  @IsEnum(OrdemOrdenacao)
  ordem?: OrdemOrdenacao;

  @ApiPropertyOptional({ description: 'Incluir estatísticas na resposta', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  incluir_estatisticas?: boolean = false;

  @ApiPropertyOptional({ description: 'Salvar dados localmente se não encontrados', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  salvar_local?: boolean = true;

  @ApiPropertyOptional({ description: 'Horário de início para filtrar (HH:MM)', example: '08:00' })
  @IsOptional()
  @IsString()
  horarioInicio?: string;

  @ApiPropertyOptional({ description: 'Horário de fim para filtrar (HH:MM)', example: '18:00' })
  @IsOptional()
  @IsString()
  horarioFim?: string;

  @ApiPropertyOptional({ description: 'Texto para busca geral em múltiplos campos' })
  @IsOptional()
  @IsString()
  buscaTexto?: string;

  @ApiPropertyOptional({ description: 'Email do usuário que editou o registro' })
  @IsOptional()
  @IsString()
  editado_por_usuario_email?: string;

  @ApiPropertyOptional({ description: 'Código do cobrador' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cod_cobrador?: number;

  @ApiPropertyOptional({ description: 'Sentido da viagem em texto (IDA, VOLTA, CIRCULAR)' })
  @IsOptional()
  @IsString()
  sentido_texto?: string;

  @ApiPropertyOptional({ description: 'Período do dia (MANHÃ, TARDE, NOITE, MADRUGADA)' })
  @IsOptional()
  @IsString()
  periodo_do_dia?: string;

  @ApiPropertyOptional({ description: 'Ocultar viagens marcadas como de acordo após N segundos (padrão: 30)', default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ocultar_de_acordo_apos_segundos?: number = 30;

  @ApiPropertyOptional({ description: 'Filtrar apenas viagens confirmadas (de_acordo = TRUE)', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  apenas_confirmadas?: boolean = false;

  @ApiPropertyOptional({ description: 'Incluir o histórico de alterações na resposta', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  incluir_historico?: boolean = false;
}
