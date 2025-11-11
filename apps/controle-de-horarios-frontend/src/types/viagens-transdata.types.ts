export interface ViagemTransdata {
  id: number;
  hashDados: string;
  dataReferencia: string;
  isAtivo: boolean;
  createdAt: string;
  updatedAt: string;
  ultimaSincronizacao: string;
  
  // ✅ CAMPOS PRINCIPAIS BASEADOS NA TABELA REAL
  NomeLinha: string;              // Nome completo da linha (ex: "180.0 - São Sebastião / Rod. P. Piloto")
  Servico: number;                // Número do serviço
  SentidoText: string;            // Sentido da viagem (IDA/VOLTA)
  InicioPrevistoText: string;     // Horário previsto de início
  InicioRealizadoText: string;    // Horário realizado de início
  FimPrevistoText: string;        // Horário previsto de fim
  FimRealizadoText: string;       // Horário realizado de fim
  PontoFinal: string;             // Tipo de ponto final (Manual/Automático)
  statusCumprimento: string;      // Status (CUMPRIDA/NAO_CUMPRIDA/etc)
  
  // ✅ CAMPOS ADICIONAIS DISPONÍVEIS
  PrefixoPrevisto?: string;       // Prefixo do veículo previsto
  PrefixoRealizado?: string;      // Prefixo do veículo realizado
  NomePI?: string;                // Nome do ponto inicial
  NomePF?: string;                // Nome do ponto final
  Trajeto?: string;               // Descrição do trajeto
  NomeMotorista?: string;         // Nome do motorista
  MatriculaMotorista?: string;    // Matrícula do motorista
  NomeCobrador?: string;          // Nome do cobrador
  MatriculaCobrador?: string;     // Matrícula do cobrador
  ParadasLbl?: string;            // Label das paradas
  Link1Text?: string;             // Link 1
  HistoricoLbl?: string;          // Label do histórico
  Link2Text?: string;             // Link 2
  
  // ✅ CAMPOS DE STATUS DETALHADOS
  ParcialmenteCumprida?: number;  // Flag parcialmente cumprida
  NaoCumprida?: number;           // Flag não cumprida
  ForadoHorarioInicio?: number;   // Flag fora do horário início
  ForadoHorarioFim?: number;      // Flag fora do horário fim
  AtrasadoInicio?: number;        // Flag atrasado início
  AtrasadoFim?: number;           // Flag atrasado fim
  AdiantadoInicio?: number;       // Flag adiantado início
  AdiantadoFim?: number;          // Flag adiantado fim
  NaoCumpridoInicio?: number;     // Flag não cumprido início
  NaoCumpridoFim?: number;        // Flag não cumprido fim
  
  // ✅ CAMPOS TÉCNICOS
  IdLinha?: number;               // ID da linha
  InicioPrevisto?: string;        // Horário previsto (formato técnico)
  InicioRealizado?: string;       // Horário realizado (formato técnico)
  StatusInicio?: number;          // Status numérico do início
  FimPrevisto?: string;           // Fim previsto (formato técnico)
  FimRealizado?: string;          // Fim realizado (formato técnico)
  StatusFim?: number;             // Status numérico do fim
  Sentido?: boolean;              // Sentido booleano
  Viagem?: number;                // Número da viagem
  PontosCumpridosPercentual?: string; // Percentual de pontos cumpridos
  ValidouPontosCumpridos?: number;    // Flag validação pontos
  KMProgramado?: string;          // KM programado
  KMRodado?: string;              // KM rodado
  Consolidad?: number;            // Flag consolidado
  
  // ✅ CAMPOS LEGADOS (compatibilidade)
  codigoLinha?: string;           // Campo legado
  sentidoTexto?: string;          // Campo legado
  numeroServico?: number;         // Campo legado
  horaProgramada?: string;        // Campo legado
  horaRealizada?: string;         // Campo legado
  atraso?: number;                // Campo legado
}

export interface FiltrosViagem {
  sentido?: 'IDA' | 'VOLTA';
  codigoLinha?: string;           // Código extraído do NomeLinha
  numeroServico?: number;         // Mesmo que Servico
  statusCumprimento?: string;
  pontoFinal?: string;            // Filtro por tipo de ponto final
  nomeLinha?: string;             // Busca no NomeLinha
  horarioInicio?: string;         // Filtro por horário início
  horarioFim?: string;            // Filtro por horário fim
  prefixoRealizado?: string;    // NOVO
  nomeMotorista?: string;         // NOVO
  somenteAtrasados?: boolean;     // NOVO
  page?: number;
  limit?: number;
};