// src/features/controle-horarios/types/controle-horarios.types.ts

export interface ViagemGlobusBase {
  id: string;
  codigoLinha: string;
  nomeLinha: string;
  codServicoNumero: string;
  sentidoTexto: string;
  horSaidaTime: string;
  horChegadaTime: string;
  nomeMotorista: string;
  setorPrincipal: string;
  localOrigemViagem: string;
  duracaoMinutos: number;
  periodoDoDia: string;
  flgSentido: string;
  
  // ✅ CAMPOS ADICIONADOS
  codMotorista?: string;
  nomeCobrador?: string;
  codCobrador?: string;
  setorPrincipalLinha?: string;
  codLocalTerminalSec?: string;
  codLocalidade?: string;
  codServicoCompleto?: string;
  totalHorarios?: string;
  dataViagem?: string;
  localDestinoViagem?: string;
}

export interface DadosEditaveis {
  id?: string;
  numeroCarro?: string;
  informacaoRecolhe?: string;
  crachaFuncionario?: string;
  observacoes?: string;
  usuarioEdicao?: string;
  usuarioEmail?: string;
  updatedAt?: Date;
  createdAt?: Date;
  jaFoiEditado: boolean;
}

export interface ControleHorarioItem {
  viagemGlobus: ViagemGlobusBase;
  dadosEditaveis: DadosEditaveis;
}

// ✅ CORRIGIDO: Interface de filtros apenas com campos suportados pelo backend
export interface FiltrosControleHorarios {
  setorPrincipal?: string;
  codigoLinha?: string[];
  codServicoNumero?: string;
  sentidoTexto?: string;
  horarioInicio?: string;
  horarioFim?: string;
  nomeMotorista?: string;
  nomeCobrador?: string; // Adicionado
  codCobrador?: string; // Adicionado
  localOrigem?: string;
  codAtividade?: string;
  localDestino?: string;
  crachaMotorista?: string;
  buscaTexto?: string;
  limite?: number;
  pagina?: number;
  editadoPorUsuario?: boolean;
}

// ✅ NOVA: Interface para filtros locais (frontend only)
export interface FiltrosControleHorariosLocal extends FiltrosControleHorarios {
  statusEdicao?: 'todos' | 'editados' | 'nao_editados';
  nomeCobrador?: string;
  codCobrador?: string;
  numeroCarro?: string;
  informacaoRecolhe?: string;
}

export interface ControleHorarioResponse {
  success: boolean;
  message: string;
  data: ControleHorarioItem[];
  total: number;
  pagina: number;
  limite: number;
  temMaisPaginas: boolean;
  filtrosAplicados: FiltrosControleHorarios;
  estatisticas: {
    totalViagens: number;
    viagensEditadas: number;
    viagensNaoEditadas: number;
    percentualEditado: number;
    setoresUnicos: string[];
    linhasUnicas: string[];
    servicosUnicos: string[];
    motoristasUnicos: string[];
    cobradoresUnicos: string[];
    terminaisUnicos: string[];
  };
  executionTime: string;
  dataReferencia: string;
}

export interface OpcoesControleHorarios {
  setores: string[];
  linhas: { codigo: string; nome: string }[];
  servicos: string[];
  sentidos: string[];
  motoristas: string[];
  locaisOrigem: string[];
  locaisDestino: string[];
  cobradores: string[];
  terminais: string[];
  localidades: string[];
}

export interface SalvarControleHorario {
  viagemGlobusId: string;
  numeroCarro?: string;
  informacaoRecolhe?: string;
  crachaFuncionario?: string;
  observacoes?: string;
}

export interface SalvarMultiplosControles {
  dataReferencia: string;
  controles: SalvarControleHorario[];
  usuarioEdicao?: string;
  usuarioEmail?: string;
}

export interface EstatisticasControleHorarios {
  dataReferencia: string;
  totalViagens: number;
  viagensEditadas: number;
  viagensNaoEditadas: number;
  percentualEditado: number;
  ultimaAtualizacao: Date;
  totalMotoristas: number;
  totalCobradores: number;
  totalLinhas: number;
  totalServicos: number;
  totalSetores: number;
}

// ✅ Interface para dados do usuário
export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  perfil: string;
}

// ✅ NOVAS: Interfaces para status e validação
export interface StatusControleHorarios {
  existeViagensGlobus: boolean;
  totalViagensGlobus: number;
  viagensEditadas: number;
  percentualEditado: number;
  ultimaAtualizacao: Date | null;
  totalMotoristas: number;
  totalCobradores: number;
  totalLinhas: number;
  totalServicos: number;
  totalSetores: number;
}

export interface ValidacaoControleHorarios {
  viagemGlobusId: string;
  campo: string;
  erro: string;
  valorInvalido?: any;
}

export interface ResultadoSalvamento {
  success: boolean;
  message: string;
  salvos: number;
  erros: number;
  detalhes?: Array<{
    viagemGlobusId: string;
    status: 'sucesso' | 'erro';
    mensagem: string;
  }>;
}

// ✅ NOVAS: Interfaces para histórico e auditoria
export interface HistoricoEdicao {
  id: string;
  viagemGlobusId: string;
  dataEdicao: Date;
  usuarioEdicao: string;
  usuarioEmail: string;
  camposAlterados: string[];
  valoresAnteriores: Record<string, any>;
  valoresNovos: Record<string, any>;
  observacoes?: string;
}

export interface AuditoriaControleHorarios {
  totalEdicoes: number;
  editoresMaisAtivos: Array<{
    usuario: string;
    email: string;
    totalEdicoes: number;
  }>;
  camposMaisEditados: Array<{
    campo: string;
    totalEdicoes: number;
  }>;
  ultimasEdicoes: HistoricoEdicao[];
}

// ✅ NOVAS: Interfaces para exportação
export interface OpcoesExportacao {
  formato: 'excel' | 'csv' | 'pdf';
  incluirFiltros: boolean;
  incluirEstatisticas: boolean;
  incluirHistorico: boolean;
  campos?: string[];
}

export interface ResultadoExportacao {
  success: boolean;
  message: string;
  arquivo?: Blob;
  nomeArquivo: string;
  tamanhoArquivo: number;
  totalRegistros: number;
}

// ✅ NOVAS: Interfaces para sincronização
export interface StatusSincronizacao {
  ultimaSincronizacao: Date | null;
  sincronizandoAtualmente: boolean;
  proximaSincronizacao: Date | null;
  totalRegistrosSincronizados: number;
  errosSincronizacao: string[];
}

export interface ResultadoSincronizacao {
  success: boolean;
  message: string;
  dadosSincronizados: {
    viagensGlobus: number;
    viagensTransdata: number;
    controlesCriados: number;
    controlesAtualizados: number;
  };
  tempoExecucao: string;
  proximaSincronizacao: Date;
}

// ✅ NOVAS: Tipos para configurações
export type TipoVisualizacao = 'tabela' | 'cards' | 'lista';
export type TipoOrdenacao = 'horario' | 'linha' | 'motorista' | 'setor';
export type DirecaoOrdenacao = 'asc' | 'desc';

export interface ConfiguracoesVisualizacao {
  tipoVisualizacao: TipoVisualizacao;
  itensPorPagina: number;
  ordenacao: TipoOrdenacao;
  direcaoOrdenacao: DirecaoOrdenacao;
  colunasMostradas: string[];
  filtrosRapidos: boolean;
  atualizacaoAutomatica: boolean;
  intervalAtualizacao: number; // em segundos
}

// ✅ NOVAS: Interfaces para notificações
export interface NotificacaoControleHorarios {
  id: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  titulo: string;
  mensagem: string;
  timestamp: Date;
  lida: boolean;
  acao?: {
    texto: string;
    callback: () => void;
  };
}

// ✅ NOVAS: Interfaces para relatórios
export interface RelatorioControleHorarios {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'diario' | 'semanal' | 'mensal' | 'personalizado';
  filtros: FiltrosControleHorarios;
  agendamento?: {
    ativo: boolean;
    frequencia: 'diario' | 'semanal' | 'mensal';
    horario: string;
    destinatarios: string[];
  };
  criadoPor: string;
  criadoEm: Date;
  ultimaExecucao?: Date;
}