// src/comparacao-viagens/utils/trip-comparator.util.ts

import { ViagemGlobusBaseDto } from '../../controle-horarios/dto/response-controle-horarios.dto';

// Mapeamento de Sentido
const SENTIDO_MAP: { [key: string]: string } = {
  'C': 'IDA',
  'I': 'IDA',
  'V': 'VOLTA',
  'IDA': 'IDA',
  'VOLTA': 'VOLTA',
};

// Enum para as combinações de comparação
export enum CombinacaoComparacao {
  TUDO_IGUAL = 1,
  SO_HORARIO_DIFERENTE = 2,
  SO_SERVICO_DIFERENTE = 3,
  SERVICO_E_HORARIO_DIFERENTES = 4,
  SO_SENTIDO_DIFERENTE = 5,
  SENTIDO_E_HORARIO_DIFERENTES = 6,
  SENTIDO_E_SERVICO_DIFERENTES = 7,
  SO_LINHA_IGUAL = 8,
  SO_LINHA_DIFERENTE = 9,
  LINHA_E_HORARIO_DIFERENTES = 10,
  LINHA_E_SERVICO_DIFERENTES = 11,
  SO_SENTIDO_IGUAL = 12,
  LINHA_E_SENTIDO_DIFERENTES = 13,
  SO_SERVICO_IGUAL = 14,
  SO_HORARIO_IGUAL = 15,
  TUDO_DIFERENTE = 16,
}

// Interface para os dados normalizados de TransData
export interface NormalizedTransDataTrip {
  linha: string;
  sentido: string;
  servico: string;
  horario: string;
}

// Interface para os dados normalizados de Globus
export interface NormalizedGlobusTrip {
  linha: string;
  sentido: string;
  servico: string;
  horario: string;
}

// ✅ Interface flexível para dados Oracle (campos em maiúsculo)
export interface OracleGlobusData {
  CODIGOLINHA?: string;
  FLG_SENTIDO?: string;
  COD_SERVICO_NUMERO?: string;
  HOR_SAIDA?: string;
  SETOR_PRINCIPAL_LINHA?: string;
  COD_LOCAL_TERMINAL_SEC?: string;
  NOMELINHA?: string;
  DATA_VIAGEM?: string;
  HOR_CHEGADA?: string;
  TOTAL_HORARIOS?: string;
  COD_LOCALIDADE?: string;
  LOCAL_ORIGEM_VIAGEM?: string;
  COD_SERVICO_COMPLETO?: string;
  COD_MOTORISTA?: string;
  NOME_MOTORISTA?: string;
  COD_COBRADOR?: string;
  NOME_COBRADOR?: string;
  [key: string]: any; // Para outros campos
}

// Função para normalizar os dados da TransData
export function normalizeTransDataTrip(transDataTrip: any): NormalizedTransDataTrip {
  // Extrai os primeiros 6 caracteres que são dígitos, ignorando o resto.
  const linha = (transDataTrip.NomeLinha.match(/\d/g) || []).join('').substring(0, 6);

  const sentido = SENTIDO_MAP[transDataTrip.SentidoText.toUpperCase()] || transDataTrip.SentidoText.toUpperCase();
  const servico = String(transDataTrip.Servico);
  // Extrai HH:mm de uma string de data/hora como "26/10/2025 15:40:00"
  const horario = transDataTrip.InicioPrevisto.split(' ')[1]?.substring(0, 5) || '';

  return {
    linha,
    sentido,
    servico,
    horario,
  };
}

// ✅ Função para normalizar os dados da Globus (aceita tanto DTO quanto dados Oracle)
export function normalizeGlobusTrip(globusTrip: ViagemGlobusBaseDto | OracleGlobusData): NormalizedGlobusTrip {
  const isOracleData = 'CODIGOLINHA' in globusTrip;
  
  let linha: string;
  let sentido: string;
  let servico: string;
  let horario: string;

  if (isOracleData) {
    const oracleData = globusTrip as OracleGlobusData;
    linha = String(oracleData.CODIGOLINHA || '').replace(/[^0-9]/g, '').substring(0, 6);
    sentido = SENTIDO_MAP[String(oracleData.FLG_SENTIDO || '').toUpperCase()] || String(oracleData.FLG_SENTIDO || '').toUpperCase();
    servico = String(oracleData.COD_SERVICO_NUMERO || '').trim();
    
    const horarioOracle = String(oracleData.HOR_SAIDA || '');
    if (horarioOracle.includes(' ')) {
      const timePart = horarioOracle.split(' ')[1];
      horario = timePart ? timePart.substring(0, 5) : '';
    } else {
      horario = horarioOracle.substring(0, 5);
    }
  } else {
    const dtoData = globusTrip as ViagemGlobusBaseDto;
    linha = String(dtoData.codigoLinha || '').replace(/[^0-9]/g, '').substring(0, 6);
    sentido = SENTIDO_MAP[String(dtoData.flgSentido || '').toUpperCase()] || String(dtoData.flgSentido || '').toUpperCase();
    servico = String(dtoData.codServicoNumero || '').trim();
    horario = String(dtoData.horSaidaTime || '').substring(0, 5);
  }

  return {
    linha,
    sentido,
    servico,
    horario,
  };
}

// Função para comparar duas viagens e determinar a combinação
export function compareTrips(
  transDataTrip: NormalizedTransDataTrip,
  globusTrip: NormalizedGlobusTrip,
): CombinacaoComparacao {
  const linhaIgual = transDataTrip.linha === globusTrip.linha;
  const sentidoIgual = transDataTrip.sentido === globusTrip.sentido;
  const servicoIgual = transDataTrip.servico === globusTrip.servico;
  const horarioIgual = transDataTrip.horario === globusTrip.horario;

  if (linhaIgual && sentidoIgual && servicoIgual && horarioIgual) {
    return CombinacaoComparacao.TUDO_IGUAL; // 1
  } else if (linhaIgual && sentidoIgual && servicoIgual && !horarioIgual) {
    return CombinacaoComparacao.SO_HORARIO_DIFERENTE; // 2
  } else if (linhaIgual && sentidoIgual && !servicoIgual && horarioIgual) {
    return CombinacaoComparacao.SO_SERVICO_DIFERENTE; // 3
  } else if (linhaIgual && sentidoIgual && !servicoIgual && !horarioIgual) {
    return CombinacaoComparacao.SERVICO_E_HORARIO_DIFERENTES; // 4
  } else if (linhaIgual && !sentidoIgual && servicoIgual && horarioIgual) {
    return CombinacaoComparacao.SO_SENTIDO_DIFERENTE; // 5
  } else if (linhaIgual && !sentidoIgual && servicoIgual && !horarioIgual) {
    return CombinacaoComparacao.SENTIDO_E_HORARIO_DIFERENTES; // 6
  } else if (linhaIgual && !sentidoIgual && !servicoIgual && horarioIgual) {
    return CombinacaoComparacao.SENTIDO_E_SERVICO_DIFERENTES; // 7
  } else if (linhaIgual && !sentidoIgual && !servicoIgual && !horarioIgual) {
    return CombinacaoComparacao.SO_LINHA_IGUAL; // 8
  } else if (!linhaIgual && sentidoIgual && servicoIgual && horarioIgual) {
    return CombinacaoComparacao.SO_LINHA_DIFERENTE; // 9
  } else if (!linhaIgual && sentidoIgual && servicoIgual && !horarioIgual) {
    return CombinacaoComparacao.LINHA_E_HORARIO_DIFERENTES; // 10
  } else if (!linhaIgual && sentidoIgual && !servicoIgual && horarioIgual) {
    return CombinacaoComparacao.LINHA_E_SERVICO_DIFERENTES; // 11
  } else if (!linhaIgual && sentidoIgual && !servicoIgual && !horarioIgual) {
    return CombinacaoComparacao.SO_SENTIDO_IGUAL; // 12
  } else if (!linhaIgual && !sentidoIgual && servicoIgual && horarioIgual) {
    return CombinacaoComparacao.LINHA_E_SENTIDO_DIFERENTES; // 13
  } else if (!linhaIgual && !sentidoIgual && servicoIgual && !horarioIgual) {
    return CombinacaoComparacao.SO_SERVICO_IGUAL; // 14
  } else if (!linhaIgual && !sentidoIgual && !servicoIgual && horarioIgual) {
    return CombinacaoComparacao.SO_HORARIO_IGUAL; // 15
  } else if (!linhaIgual && !sentidoIgual && !servicoIgual && !horarioIgual) {
    return CombinacaoComparacao.TUDO_DIFERENTE; // 16
  }

  // Fallback para caso não encontre nenhuma combinação (não deve acontecer se todas as 16 forem cobertas)
  return CombinacaoComparacao.TUDO_DIFERENTE;
}