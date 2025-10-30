import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum StatusComparacao {
  COMPATIVEL = 'compativel',
  DIVERGENTE = 'divergente',
  APENAS_TRANSDATA = 'apenas_transdata',
  APENAS_GLOBUS = 'apenas_globus',
  HORARIO_DIVERGENTE = 'horario_divergente'
}

// Enum para as combinações de comparação (MOVIDO PARA AQUI e AGORA BASEADO EM STRINGS)
export enum CombinacaoComparacao {
  TUDO_IGUAL = 'TUDO_IGUAL',
  SO_HORARIO_DIFERENTE = 'SO_HORARIO_DIFERENTE',
  SO_SERVICO_DIFERENTE = 'SO_SERVICO_DIFERENTE',
  SERVICO_E_HORARIO_DIFERENTES = 'SERVICO_E_HORARIO_DIFERENTES',
  SO_SENTIDO_DIFERENTE = 'SO_SENTIDO_DIFERENTE',
  SENTIDO_E_HORARIO_DIFERENTES = 'SENTIDO_E_HORARIO_DIFERENTES',
  SENTIDO_E_SERVICO_DIFERENTES = 'SENTIDO_E_SERVICO_DIFERENTES',
  SO_LINHA_IGUAL = 'SO_LINHA_IGUAL',
  SO_LINHA_DIFERENTE = 'SO_LINHA_DIFERENTE',
  LINHA_E_HORARIO_DIFERENTES = 'LINHA_E_HORARIO_DIFERENTES',
  LINHA_E_SERVICO_DIFERENTES = 'LINHA_E_SERVICO_DIFERENTES',
  SO_SENTIDO_IGUAL = 'SO_SENTIDO_IGUAL',
  LINHA_E_SENTIDO_DIFERENTES = 'LINHA_E_SENTIDO_DIFERENTES',
  SO_SERVICO_IGUAL = 'SO_SERVICO_IGUAL',
  SO_HORARIO_IGUAL = 'SO_HORARIO_IGUAL',
  TUDO_DIFERENTE = 'TUDO_DIFERENTE',
}

@Entity('comparacao_viagens')
@Index(['dataReferencia', 'codigoLinha'])
@Index(['dataReferencia', 'statusComparacao'])
@Index(['dataReferencia', 'tipoCombinacao']) // Novo índice
export class ComparacaoViagem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_referencia', type: 'varchar', length: 10 })
  dataReferencia: string;

  @Column({ name: 'codigo_linha', type: 'varchar', length: 20 })
  codigoLinha: string;

  @Column({ name: 'nome_linha_transdata', type: 'varchar', length: 200, nullable: true })
  nomeLinhaTransdata: string;

  @Column({ name: 'nome_linha_globus', type: 'varchar', length: 200, nullable: true })
  nomeLinhaGlobus: string;

  // Dados Transdata
  @Column({ name: 'transdata_id', type: 'varchar', nullable: true })
  transdataId: string;

  @Column({ name: 'transdata_servico', type: 'varchar', length: 50, nullable: true })
  transdataServico: string;

  @Column({ name: 'transdata_sentido', type: 'varchar', length: 20, nullable: true })
  transdataSentido: string;

  @Column({ name: 'transdata_horario_previsto', type: 'varchar', length: 20, nullable: true })
  transdataHorarioPrevisto: string;

  @Column({ name: 'transdata_horario_realizado', type: 'varchar', length: 20, nullable: true })
  transdataHorarioRealizado: string;

  // Dados Globus
  @Column({ name: 'globus_id', type: 'varchar', nullable: true })
  globusId: string;

  @Column({ name: 'globus_servico', type: 'varchar', length: 50, nullable: true })
  globusServico: string;

  @Column({ name: 'globus_sentido_flag', type: 'varchar', length: 1, nullable: true })
  globusSentidoFlag: string;

  @Column({ name: 'globus_sentido_texto', type: 'varchar', length: 20, nullable: true })
  globusSentidoTexto: string;

  @Column({ name: 'globus_horario_saida', type: 'varchar', length: 20, nullable: true })
  globusHorarioSaida: string;

  @Column({ name: 'globus_setor', type: 'varchar', length: 50, nullable: true })
  globusSetor: string;

  // Análise da Comparação
  @Column({
    name: 'status_comparacao',
    type: 'enum',
    enum: StatusComparacao,
    default: StatusComparacao.DIVERGENTE
  })
  statusComparacao: StatusComparacao;

  @Column({
    name: 'tipo_combinacao',
    type: 'enum', // ✅ AGORA É UM ENUM
    enum: CombinacaoComparacao, // ✅ REFERENCIA O ENUM MOVIDO
    nullable: true // Pode ser nulo se for apenas Transdata ou apenas Globus
  })
  tipoCombinacao: CombinacaoComparacao; // ✅ Tipo correto

  @Column({ name: 'sentido_compativel', type: 'boolean', default: false })
  sentidoCompativel: boolean;

  @Column({ name: 'horario_compativel', type: 'boolean', default: false })
  horarioCompativel: boolean;

  @Column({ name: 'servico_compativel', type: 'boolean', default: false })
  servicoCompativel: boolean;

  @Column({ name: 'diferenca_horario_minutos', type: 'integer', nullable: true })
  diferencaHorarioMinutos: number;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
