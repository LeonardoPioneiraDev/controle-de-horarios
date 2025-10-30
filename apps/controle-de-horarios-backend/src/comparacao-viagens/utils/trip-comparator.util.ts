import { ControleHorarioItemDto } from '../../controle-horarios/dto/response-controle-horarios.dto';
import { CombinacaoComparacao } from '../entities/comparacao-viagem.entity'; // ✅ Importar CombinacaoComparacao da entidade
import { Logger } from '@nestjs/common';
import { ViagemGlobus } from '../../viagens-globus/entities/viagem-globus.entity'; // Import ViagemGlobus entity

const logger = new Logger('TripComparatorUtil');

// Mapeamento de Sentido
const SENTIDO_MAP: { [key: string]: string } = {
  'C': 'IDA',
  'I': 'IDA',
  'V': 'VOLTA',
  'IDA': 'IDA',
  'VOLTA': 'VOLTA',
  'CIRCULAR': 'IDA', // Map Transdata's 'CIRCULAR' to 'IDA' for comparison if that's the rule
};

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
  const match = transDataTrip.NomeLinha.match(/^(\d+(\.\d+)?)/);
  let linha = match ? match[1] : ''; // Get "0.018" or "018.1"
  linha = linha.replace(/\./g, '').trim(); // Remove dots and trim: "0018" or "0181"
  linha = String(parseInt(linha, 10)); // Convert to int, then back to string to remove leading zeros

  const sentido = SENTIDO_MAP[transDataTrip.SentidoText.toUpperCase()] || transDataTrip.SentidoText.toUpperCase();
  const servico = String(parseInt(transDataTrip.Servico, 10));
  // Extrai HH:mm de uma string de data/hora como "26/10/2025 15:40:00"
  const horario = transDataTrip.InicioPrevisto.split(' ')[1]?.substring(0, 5) || '';

  return {
    linha,
    sentido,
    servico,
    horario,
  };
}

// ✅ Função para normalizar os dados da Globus (aceita tanto DTO quanto dados Oracle e a entidade ViagemGlobus)
export function normalizeGlobusTrip(globusTrip: ControleHorarioItemDto | OracleGlobusData | ViagemGlobus): NormalizedGlobusTrip {
  // ✅ Detectar se é dados Oracle (campos em maiúsculo) ou DTO (camelCase)
  const isOracleData = 'CODIGOLINHA' in globusTrip;
  
  let linha: string;
  let sentido: string;
  let servico: string;
  let horario: string;

  if (isOracleData) {
    // ✅ Dados Oracle (campos em maiúsculo)
    const oracleData = globusTrip as OracleGlobusData;
    logger.debug(`[normalizeGlobusTrip] Oracle Data - HOR_SAIDA: ${oracleData.HOR_SAIDA}`);
    linha = String(oracleData.CODIGOLINHA || '').replace(/[^0-9]/g, '').trim();
    linha = String(parseInt(linha, 10)); // Convert to int, then back to string to remove leading zeros
    sentido = SENTIDO_MAP[String(oracleData.FLG_SENTIDO || '').toUpperCase()] || String(oracleData.FLG_SENTIDO || '').toUpperCase();
    servico = String(parseInt(String(oracleData.COD_SERVICO_NUMERO || '').replace(/[^0-9]/g, ''), 10));
    
    // ✅ Processar horário Oracle (formato: "01/01/1900 06:07:01")
    const horarioOracle = String(oracleData.HOR_SAIDA || '');
    if (horarioOracle.includes(' ')) {
      const timePart = horarioOracle.split(' ')[1];
      horario = timePart ? timePart.substring(0, 5) : '';
    } else {
      horario = horarioOracle.substring(0, 5);
    }
  } else {
    // ✅ DTO (camelCase) or ViagemGlobus entity
    const dtoData = globusTrip as ViagemGlobus; // Cast to ViagemGlobus directly as it's the entity
    logger.debug(`[normalizeGlobusTrip] DTO Data - horSaida: ${dtoData.horSaida}, horSaidaTime: ${dtoData.horSaidaTime}`);

    linha = String(dtoData.codigoLinha || '').replace(/[^0-9]/g, '').trim();
    linha = String(parseInt(linha, 10)); // Convert to int, then back to string to remove leading zeros
    sentido = SENTIDO_MAP[String(dtoData.flgSentido || '').toUpperCase()] || String(dtoData.flgSentido || '').toUpperCase();
    servico = String(parseInt(String(dtoData.codServicoNumero || '').replace(/[^0-9]/g, ''), 10));

    // Prioritize horSaida (Date object) if available and valid
    if (dtoData.horSaida instanceof Date && !isNaN(dtoData.horSaida.getTime())) {
      horario = dtoData.horSaida.toTimeString().substring(0, 5); // Format to HH:mm
    } else {
      // Fallback to horSaidaTime string
      horario = String(dtoData.horSaidaTime || '').substring(0, 5);
    }
  }

  logger.debug(`[normalizeGlobusTrip] Final Horario: ${horario}`);

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
  const diffHorario = Math.abs(
    (new Date(`1970-01-01T${transDataTrip.horario}:00`).getTime()) -
    (new Date(`1970-01-01T${globusTrip.horario}:00`).getTime())
  ) / (1000 * 60);
  const horarioIgual = diffHorario <= 1; // Consider times equal if within 2 minutes

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
