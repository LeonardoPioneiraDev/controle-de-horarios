// Interfaces base da entidade
export interface ControleHorario {
  id: string;
  setor_principal_linha: string;
  cod_local_terminal_sec: number;
  codigo_linha: string;
  nome_linha: string;
  cod_destino_linha?: number;
  local_destino_linha?: string;
  flg_sentido: string;
  data_viagem: Date;
  desc_tipodia?: string;
  hor_saida: Date;
  hor_chegada: Date;
  // Campos ajustáveis/estado
  hor_saida_ajustada?: Date | null;
  hor_chegada_ajustada?: Date | null;
  atraso_motivo?: string | null;
  atraso_observacao?: string | null;
  de_acordo?: boolean;
  de_acordo_em?: Date | null;
  cod_origem_viagem?: number;
  local_origem_viagem?: string;
  cod_servico_completo?: string;
  cod_servico_numero?: string;
  cod_atividade?: number;
  nome_atividade?: string;
  flg_tipo?: string;
  cracha_motorista_globus?: number;
  nome_motorista?: string;
  cracha_motorista?: string;
  chapa_func_motorista?: string;
  cracha_cobrador_globus?: number;
  nome_cobrador?: string;
  cracha_cobrador?: string;
  chapa_func_cobrador?: string;
  total_horarios: number;
  placaVeiculo?: string;
  garagemVeiculo?: string;
  prefixo_veiculo?: string;
  motorista_substituto_nome?: string;
  motorista_substituto_cracha?: string;
  cobrador_substituto_nome?: string;
  cobrador_substituto_cracha?: string;
  observacoes_edicao?: string;
  editado_por_nome?: string;
  editado_por_email?: string;
  data_referencia: string;
  hash_dados: string;
  created_at: Date;
  updated_at: Date;
  sentido_texto?: string;
  periodo_do_dia?: string;
  tem_cobrador?: boolean;
  origem_dados?: string;
  is_ativo?: boolean;
  cod_local_destino_linha?: number; // Added
}

// Interface para compatibilidade com o frontend (com aliases)
export interface ControleHorarioItem extends ControleHorario {
  // Aliases para compatibilidade com o frontend existente
  setorPrincipalLinha: string; // alias para setor_principal_linha
  codigoLinha: string; // alias para codigo_linha
  nomeLinha: string; // alias para nome_linha
  horaSaida: string; // alias para hor_saida (formatado)
  horaChegada: string; // alias para hor_chegada (formatado)
  nomeMotoristaGlobus: string; // alias para nome_motorista
  crachaMotoristaGlobus: number; // alias para cracha_motorista_globus
  nomeCobradorGlobus: string; // alias para nome_cobrador
  crachaCobradorGlobus: number; // alias para cracha_cobrador_globus
  codServicoNumero: string; // alias para cod_servico_numero
  descTipoDia: string; // alias para desc_tipodia
  localDestinoLinha: string; // alias para local_destino_linha
  
  // Campos editáveis (aliases)
  numeroCarro: string; // alias para prefixo_veiculo
  nomeMotoristaEditado: string; // alias para motorista_substituto_nome
  crachaMotoristaEditado: string; // alias para motorista_substituto_cracha
  nomeCobradorEditado: string; // alias para cobrador_substituto_nome
  crachaCobradorEditado: string; // alias para cobrador_substituto_cracha
  observacoes: string; // alias para observacoes_edicao
  informacaoRecolhe: string; // campo adicional para recolhimento
  
  // Campos calculados
  jaFoiEditado: boolean;
  viagemGlobusId: string; // alias para id
  duracaoMinutos: number;
  usuarioEdicao: string; // alias para editado_por_nome
  usuarioEmail: string; // alias para editado_por_email
}

// ✅ Interface de filtros apenas com campos suportados pelo backend
export interface FiltrosControleHorarios {
  setor_principal_linha?: string;
  codigo_linha?: string[];
  cod_servico_numero?: string;
  cracha_funcionario?: string;
  sentido_texto?: string;
  horarioInicio?: string;
  horarioFim?: string;
  nome_motorista?: string;
  cracha_motorista?: string;
  nome_cobrador?: string;
  cracha_cobrador?: string;
  cod_cobrador?: number; // Added
  local_origem_viagem?: string;
  cod_atividade?: number;
  local_destino_linha?: string;
  buscaTexto?: string; // Added
  editado_por_usuario_email?: string; // Added
  // Backend flag: filtra apenas viagens que já foram editadas
  apenas_editadas?: boolean;
  apenas_confirmadas?: boolean; // de_acordo = true
  limite?: number;
  pagina?: number;
  ordenar_por?: string;
  ordem?: "ASC" | "DESC";
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
  motoristas: { cracha: string; nome: string; }[];
  locaisOrigem: string[];
  locaisDestino: string[];
}

export interface UpdateControleHorarioDto {
  viagemGlobusId: string;
  prefixo_veiculo?: string;
  informacaoRecolhe?: string;
  cracha_funcionario?: string;
  observacoes_edicao?: string;
  motorista_substituto_nome?: string;
  motorista_substituto_cracha?: string;
  cobrador_substituto_nome?: string;
  cobrador_substituto_cracha?: string;
}

export interface SingleControleHorarioUpdate {
  id: string;
  prefixo_veiculo?: string;
  motorista_substituto_nome?: string;
  motorista_substituto_cracha?: string;
  cobrador_substituto_nome?: string;
  cobrador_substituto_cracha?: string;
  observacoes_edicao?: string;
}

export interface UpdateMultipleControleHorariosDto {
  updates: SingleControleHorarioUpdate[];
  editorNome: string;
  editorEmail: string;
}

export interface EstatisticasControleHorarios {
  data_referencia: string;
  totalViagens: number;
  viagensEditadas: number;
  viagensNaoEditadas: number;
  percentualEditado: number;
  ultimaAtualizacao: Date | null;
  setoresUnicos: string[];
  linhasUnicas: string[];
  servicosUnicos: string[];
}

export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  perfil: string;
}

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

// Interfaces para histórico e auditoria
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

// Interfaces para exportação
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

// Interfaces para sincronização
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
  overwrite?: boolean;
}

export interface SincronizacaoResponse {
  success: boolean;
  message: string;
  totalSincronizados: number;
  totalExcluidos: number;
}

// Tipos para configurações
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

// Interfaces para notificações
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

// Interfaces para relatórios
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

// DTOs para compatibilidade com backend
export interface FiltrosControleHorarioDto {
  data_viagem?: string;
  setores?: number[];
  codigo_linha?: string[];
  nome_linha?: string;
  sentido?: string;
  setor_principal_linha?: string;
  local_origem_viagem?: string;
  cod_servico_numero?: string;
  nome_motorista?: string;
  nome_cobrador?: string;
  cod_atividade?: number;
  nome_atividade?: string;
  desc_tipodia?: string;
  prefixo_veiculo?: string;
  motorista_substituto_nome?: string;
  motorista_substituto_cracha?: string;
  cobrador_substituto_nome?: string;
  cobrador_substituto_cracha?: string;
  cracha_funcionario?: string;
  apenas_editadas?: boolean;
  salvar_local?: boolean;
  limite?: number;
  pagina?: number;
  ordenar_por?: string;
  ordem?: 'ASC' | 'DESC';
  incluir_estatisticas?: boolean;
}

export interface OpcoesControleHorariosDto {
  setores: string[];
  linhas: { codigo: string; nome: string }[];
  servicos: string[];
  atividades: string[];
  tiposDia: string[];
  sentidos: string[];
  motoristas: { nome: string; cracha: string }[];
  locaisOrigem: string[];
  locaisDestino: string[];
}

export interface StatusControleHorariosData {
  existeNoBanco: boolean;
  totalRegistros: number;
  ultimaAtualizacao: Date | null;
  setoresDisponiveis: string[];
  linhasDisponiveis: number;
  atividadesDisponiveis: string[];
  tiposDiaDisponiveis: string[];
  existeViagensGlobus?: boolean;
  totalViagensGlobus?: number;
  viagensEditadas?: number;
  percentualEditado?: number;
}

export interface StatusControleHorariosDto {
  success: boolean;
  message: string;
  data: StatusControleHorariosData;
}

export interface SalvarControleHorariosDto {
  viagemGlobusId: string;
  placaVeiculo?: string;
  prefixo_veiculo?: string;
  garagemVeiculo?: string;
  motorista_substituto_nome?: string;
  motorista_substituto_cracha?: string;
  cobrador_substituto_nome?: string;
  cobrador_substituto_cracha?: string;
  observacoes_edicao?: string;
  numeroCarro?: string;
  nomeMotoristaEditado?: string;
  crachaMotoristaEditado?: string;
  nomeCobradorEditado?: string;
  crachaCobradorEditado?: string;
  editorNome?: string;
  editorEmail?: string;
  // Campos adicionados para replicação condicional
  codigo_linha?: string;
  cod_servico_numero?: string;
  cracha_motorista?: string;
}



export interface SincronizarControleHorariosResponseDto {
  sincronizadas: number;
  novas: number;
  atualizadas: number;
  erros: number;
  desativadas: number;
}

export interface EstatisticasControleHorariosDto {
  TOTAL_REGISTROS_HOJE: number;
  TOTAL_LINHAS: number;
  TOTAL_SETORES: number;
  TOTAL_MOTORISTAS: number;
  PRIMEIRO_HORARIO: string;
  ULTIMO_HORARIO: string;
  ultimaAtualizacao?: Date | null;
}

export interface ControleHorarioResponseDto {
  success: boolean;
  message: string;
  data: ControleHorarioItem[];
  count: number;
  executionTime: string;
  source: string;
  filters: FiltrosControleHorarios;
  sincronizado: boolean;
  total?: number;
  temMaisPaginas?: boolean;
  estatisticas?: EstatisticasControleHorariosDto;
}
