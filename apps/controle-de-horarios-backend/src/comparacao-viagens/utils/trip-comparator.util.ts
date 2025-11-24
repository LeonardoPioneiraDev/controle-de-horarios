import { ControleHorario } from '../../controle-horarios/entities/controle-horario.entity';
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

// Exceções específicas de equivalência de linha entre fontes
// Ex.: Transdata "0181" ≡ Globus "00181"
const LINE_EQUIVALENT_PAIRS: Array<[string, string]> = [
  ['0181', '00181'],
  ['0202', '00202'],
];

const LINE_EQUIVALENCE: Map<string, Set<string>> = new Map();
for (const [a, b] of LINE_EQUIVALENT_PAIRS) {
  const A = a.replace(/[^0-9]/g, '');
  const B = b.replace(/[^0-9]/g, '');
  if (!LINE_EQUIVALENCE.has(A)) LINE_EQUIVALENCE.set(A, new Set());
  if (!LINE_EQUIVALENCE.has(B)) LINE_EQUIVALENCE.set(B, new Set());
  LINE_EQUIVALENCE.get(A)!.add(B);
  LINE_EQUIVALENCE.get(B)!.add(A);
}

function areLinesEquivalent(a: string, b: string): boolean {
  if (a === b) return true;
  const eq = LINE_EQUIVALENCE.get(a);
  return !!(eq && eq.has(b));
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
  // NomeLinha pode vir como: "100.0 - Itapoã Parque  Paranoá ..."
  // Regra: considerar apenas os números do prefixo (antes do hífen), ignorando ponto, espaços e '-'
  const nomeLinha: string = String(transDataTrip.NomeLinha || '');
  const prefixo = nomeLinha.includes('-') ? nomeLinha.split('-')[0] : nomeLinha.split(' ')[0] || nomeLinha;
  const prefixoTrim = String(prefixo || '').trim().replace(/\s+/g, '');
  let linhaRaw = '';
  if (prefixoTrim.startsWith('0.181')) {
    linhaRaw = '0181';
  } else if (prefixoTrim.startsWith('018.1')) {
    linhaRaw = '00181';
  } else {
    linhaRaw = String(prefixo || '').replace(/[^0-9]/g, '');
  }
  if (!linhaRaw) {
    // fallback: usar codigoLinha se disponível
    linhaRaw = String(transDataTrip.codigoLinha || '').replace(/[^0-9]/g, '');
  }
  const linha = linhaRaw; // preservar zeros à esquerda

  const sentido = SENTIDO_MAP[String(transDataTrip.SentidoText || '').toUpperCase()] || String(transDataTrip.SentidoText || '').toUpperCase();
  const servico = String(parseInt(String(transDataTrip.Servico ?? transDataTrip.codServicoNumero ?? ''), 10));
  // Extrai HH:mm de uma string de data/hora como "26/10/2025 15:40:00"
  const horario = String(transDataTrip.InicioPrevisto || '').split(' ')[1]?.substring(0, 5) || '';

  return {
    linha,
    sentido,
    servico,
    horario,
  };
}

// ✅ Função para normalizar os dados da Globus (aceita tanto DTO quanto dados Oracle e a entidade ViagemGlobus)
export function normalizeGlobusTrip(globusTrip: ControleHorario | OracleGlobusData | ViagemGlobus): NormalizedGlobusTrip {
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
    linha = String(oracleData.CODIGOLINHA || '').replace(/[^0-9]/g, '').trim(); // preservar zeros à esquerda
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

    linha = String(dtoData.codigoLinha || '').replace(/[^0-9]/g, '').trim(); // preservar zeros à esquerda
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
  const onlyDigits = (s: string) => String(s || '').replace(/[^0-9]/g, '');
  // Regra: não comparar linhas diferentes. Se as linhas (apenas dígitos) forem diferentes, tratar como TUDO_DIFERENTE
  const tdLine = onlyDigits(transDataTrip.linha);
  const gbLine = onlyDigits(globusTrip.linha);
  if (!areLinesEquivalent(tdLine, gbLine)) {
    return CombinacaoComparacao.TUDO_DIFERENTE;
  }
  const lineVariants = (s: string): Set<string> => {
    const variants = new Set<string>();
    const d = onlyDigits(s);
    if (d) variants.add(d);
    // Variante 1: remover um zero final (ex.: 1470 -> 147, 1000 -> 100)
    if (d && d.endsWith('0') && d.length > 1) variants.add(d.slice(0, -1));
    // Variante 2: adicionar um zero se até 3 dígitos (ex.: 147 -> 1470, 100 -> 1000)
    if (d && d.length <= 3) variants.add(d + '0');
    return variants;
  };
  const linhaIgual = true; // Já validado por areLinesEquivalent(tdLine, gbLine)
  const sentidoIgual = transDataTrip.sentido === globusTrip.sentido;
  const servicoIgual = transDataTrip.servico === globusTrip.servico;
  const diffHorario = Math.abs(
    (new Date(`1970-01-01T${transDataTrip.horario}:00`).getTime()) -
    (new Date(`1970-01-01T${globusTrip.horario}:00`).getTime())
  ) / (1000 * 60);
  const TIME_EQUAL_MIN = Number.isFinite(parseInt(process.env.COMPARE_TIME_EQUAL_MIN || '', 10))
    ? parseInt(process.env.COMPARE_TIME_EQUAL_MIN!, 10)
    : 2;
  const horarioIgual = diffHorario <= TIME_EQUAL_MIN; // Consider times equal if within threshold

  // Regra: para match 100%, exigir linha + serviço + sentido + horário iguais
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
