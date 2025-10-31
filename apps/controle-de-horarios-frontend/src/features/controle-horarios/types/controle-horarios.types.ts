// src/features/controle-horarios/types/controle-horarios.types.ts

export interface ControleHorarioItem {
  // Campos do Banco de Dados Local (ControleHorario)
  id: string; // ID único do controle de horário no banco de dados local (UUID)
  viagemGlobusId: string; // ID da viagem no sistema Globus (COD_SERVICO_COMPLETO)
  dataReferencia: string; // Data de referência da viagem (YYYY-MM-DD)

  // CAMPOS ORIGINAIS DO GLOBUS (apenas leitura, para contexto)
  setorPrincipalLinha: string; // Setor principal da linha (ex: "GAMA")
  codLocalTerminalSec: number; // Código do terminal secundário
  codigoLinha: string; // Código da linha (ex: "0.100")
  nomeLinha: string; // Nome da linha
  codDestinoLinha: string; // Código do destino da linha
  localDestinoLinha: string; // Nome do local de destino da linha
  flgSentido: string; // Flag de sentido (ex: "IDA", "VOLTA")
  duracaoMinutos: number; // Duração da viagem em minutos
  descTipoDia: string; // Descrição do tipo de dia (ex: "DIAS UTEIS", "SABADO", "DOMINGO")
  horaSaida: string; // Hora de saída da viagem (HH:MM)
  horaChegada: string; // Hora de chegada da viagem (HH:MM)
  codOrigemViagem: string; // Código da origem da viagem
  localOrigemViagem: string; // Nome do local de origem da viagem
  codServicoNumero: string; // Número do serviço (parte numérica do COD_SERVICO_COMPLETO)
  codAtividade: number; // Código da atividade (ex: 2 para REGULAR)
  nomeAtividade: string; // Nome da atividade (ex: "REGULAR", "RECOLHIMENTO")
  flgTipo: string; // Flag de tipo (ex: "R" para Regular, "S" para Especial)
  codMotorista: string; // Código do motorista no Globus
  nomeMotoristaGlobus: string; // Nome completo do motorista no Globus
  crachaMotoristaGlobus: string; // Crachá do motorista no Globus
  chapaFuncMotoristaGlobus: string; // Chapa/DM-TU do motorista no Globus
  codCobrador: string; // Código do cobrador no Globus
  nomeCobradorGlobus: string; // Nome completo do cobrador no Globus
  crachaCobradorGlobus: string; // Crachá do cobrador no Globus
  chapaFuncCobradorGlobus: string; // Chapa/DM-TU do cobrador no Globus
  totalHorarios: number; // Total de horários para aquela linha/setor (informação analítica do Globus)

  // CAMPOS EDITÁVEIS PELO USUÁRIO (podem ser nulos se não editados)
  numeroCarro: string | null; // Número do carro editado
  nomeMotoristaEditado: string | null; // Nome do motorista editado
  crachaMotoristaEditado: string | null; // Crachá do motorista editado
  nomeCobradorEditado: string | null; // Nome do cobrador editado
  crachaCobradorEditado: string | null; // Crachá do cobrador editado
  informacaoRecolhe: string | null; // Informação de recolhimento editada
  observacoes: string | null; // Observações editadas

  // CAMPOS DE AUDITORIA E STATUS
  usuarioEdicao: string | null; // ID do usuário que fez a última edição
  usuarioEmail: string | null; // Email do usuário que fez a última edição
  createdAt: string; // Timestamp de criação do registro de controle local
  updatedAt: string; // Timestamp da última atualização do registro de controle local
  isAtivo: boolean; // Indica se o registro de controle está ativo (sempre true para registros válidos)
  jaFoiEditado: boolean; // **IMPORTANTE:** Indica se esta viagem possui um registro de controle salvo localmente (ou seja, se foi editada).
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
  crachaMotorista?: string;
  nomeCobrador?: string;
  crachaCobrador?: string;
  localOrigem?: string;
  codAtividade?: string;
  localDestino?: string;
  servicoIgualMotorista?: boolean; // Novo filtro
  statusEdicao?: 'todos' | 'editados' | 'nao_editados'; // Usado para mapear editadoPorUsuario
  buscaTexto?: string;
  limite?: number;
  pagina?: number;
  ordenarPor?: string;
  ordem?: "ASC" | "DESC";
}

// ✅ NOVA: Interface para filtros locais (frontend only) - Mantida para extensibilidade, mas statusEdicao movido
export interface FiltrosControleHorariosLocal extends FiltrosControleHorarios {
  // statusEdicao agora está em FiltrosControleHorarios
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
  estatisticas: EstatisticasControleHorarios;
}

export interface OpcoesControleHorarios {
  setores: string[];
  linhas: { codigo: string; nome: string }[];
  servicos: string[];
  sentidos: string[];
  motoristas: { cracha: string; nome: string; }[]; // Array de objetos com crachá e nome dos motoristas únicos
  locaisOrigem: string[];
  locaisDestino: string[];
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
  ultimaAtualizacao: Date | null;
  setoresUnicos: string[];
  linhasUnicas: string[];
  servicosUnicos: string[];
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

export interface SincronizarControleHorariosDto {
  overwrite?: boolean; // Opcional. Se true, dados existentes para a data serão excluídos antes da sincronização. Padrão: false.
}

export interface SincronizacaoResponse {
  success: boolean; // Indica se a operação foi bem-sucedida
  message: string;  // Mensagem descritiva do resultado da sincronização
  totalSincronizados: number; // Quantidade de registros novos salvos do Globus
  totalExcluidos: number; // Quantidade de registros locais excluídos (se overwrite=true)
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