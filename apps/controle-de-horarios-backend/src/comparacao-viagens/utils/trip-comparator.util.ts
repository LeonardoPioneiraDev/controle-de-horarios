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

// Função para normalizar os dados da TransData
export function normalizeTransDataTrip(transDataTrip: any): NormalizedTransDataTrip {
  const linhaMatch = transDataTrip.NomeLinha.match(/^(\d{1,})[\.\s-]?(\d{1,})?/);
  let linha = '';
  if (linhaMatch) {
    linha = linhaMatch[1];
    if (linhaMatch[2]) {
      linha += linhaMatch[2];
    }
  }

  const sentido = SENTIDO_MAP[transDataTrip.SentidoText.toUpperCase()] || transDataTrip.SentidoText.toUpperCase();
  const servico = String(transDataTrip.Servico);
  const horario = transDataTrip.InicioPrevistoText.substring(0, 5); // HH:MM

  return {
    linha,
    sentido,
    servico,
    horario,
  };
}

// Função para normalizar os dados da Globus
export function normalizeGlobusTrip(globusTrip: ViagemGlobusBaseDto): NormalizedGlobusTrip {
  const linha = String(globusTrip.codigoLinha).replace(/[^0-9]/g, ''); // Apenas números
  const sentido = SENTIDO_MAP[globusTrip.flgSentido.toUpperCase()] || globusTrip.flgSentido.toUpperCase();
  const servico = String(globusTrip.codServicoNumero).padStart(2, '0'); // Garante 2 dígitos
  const horario = globusTrip.horSaidaTime.substring(0, 5); // HH:MM

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
