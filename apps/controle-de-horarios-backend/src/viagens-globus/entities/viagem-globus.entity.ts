import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('viagens_globus')
@Index(['dataViagem', 'codigoLinha'], { unique: false })
@Index(['dataViagem', 'setorPrincipal'], { unique: false })
@Index(['dataViagem'], { unique: false })
export class ViagemGlobus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'setor_principal_linha', type: 'varchar', length: 50 })
  setorPrincipal: string;

  @Column({ name: 'cod_local_terminal_sec', type: 'integer' })
  codLocalTerminalSec: number;

  @Column({ name: 'codigo_linha', type: 'varchar', length: 20 })
  codigoLinha: string;

  @Column({ name: 'nome_linha', type: 'varchar', length: 200 })
  nomeLinha: string;

  @Column({ name: 'cod_destino_linha', type: 'integer', nullable: true })
  codDestinoLinha: number;

  @Column({ name: 'local_destino_linha', type: 'varchar', length: 100, nullable: true })
  localDestinoLinha: string;

  @Column({ name: 'flg_sentido', type: 'varchar', length: 1 })
  flgSentido: string;

  @Column({ name: 'data_viagem', type: 'date' })
  dataViagem: Date;

  @Column({ name: 'hor_saida', type: 'timestamp', nullable: true })
  horSaida: Date;

  @Column({ name: 'hor_chegada', type: 'timestamp', nullable: true })
  horChegada: Date;

  @Column({ name: 'hor_saida_time', type: 'varchar', length: 8, nullable: true })
  horSaidaTime: string;

  @Column({ name: 'hor_chegada_time', type: 'varchar', length: 8, nullable: true })
  horChegadaTime: string;

  @Column({ name: 'cod_origem_viagem', type: 'integer', nullable: true })
  codOrigemViagem: number;

  @Column({ name: 'local_origem_viagem', type: 'varchar', length: 100, nullable: true })
  localOrigemViagem: string;

  @Column({ name: 'cod_servico_completo', type: 'varchar', length: 50, nullable: true })
  codServicoCompleto: string;

  @Column({ name: 'cod_servico_numero', type: 'varchar', length: 20, nullable: true })
  codServicoNumero: string;

  @Column({ name: 'cod_atividade', type: 'integer', nullable: true })
  codAtividade: number;

  @Column({ name: 'nome_atividade', type: 'varchar', length: 50, nullable: true })
  nomeAtividade: string;

  @Column({ name: 'flg_tipo', type: 'varchar', length: 1, nullable: true })
  flgTipo: string;

  @Column({ name: 'prefixo_veiculo', type: 'varchar', length: 20, nullable: true })
  prefixoVeiculo: string;

  @Column({ name: 'cod_motorista_globus', type: 'integer', nullable: true })
  codMotoristaGlobus: number;

  @Column({ name: 'cracha_motorista_globus', type: 'integer', nullable: true })
  crachaMotoristaGlobus: number;

  @Column({ name: 'chapa_func_motorista', type: 'varchar', length: 20, nullable: true })
  chapaFuncMotorista: string;

  @Column({ name: 'nome_motorista', type: 'varchar', length: 100, nullable: true })
  nomeMotorista: string;

  @Column({ name: 'cod_cobrador_globus', type: 'integer', nullable: true })
  codCobradorGlobus: number;

  @Column({ name: 'cracha_cobrador_globus', type: 'integer', nullable: true })
  crachaCobradorGlobus: number;

  @Column({ name: 'chapa_func_cobrador', type: 'varchar', length: 20, nullable: true })
  chapaFuncCobrador: string;

  @Column({ name: 'nome_cobrador', type: 'varchar', length: 100, nullable: true })
  nomeCobrador: string;

  @Column({ name: 'cod_local_destino_linha', type: 'integer', nullable: true })
  codLocalDestinoLinha: number;

  @Column({ name: 'desc_tipo_dia', type: 'varchar', length: 50, nullable: true })
  descTipoDia: string;

  @Column({ name: 'total_horarios', type: 'integer', default: 0 })
  totalHorarios: number;

  @Column({ name: 'duracao_minutos', type: 'integer', nullable: true })
  duracaoMinutos: number;

  @Column({ name: 'data_referencia', type: 'varchar', length: 10 })
  dataReferencia: string;

  @Column({ name: 'hash_dados', type: 'varchar', length: 64, unique: true })
  hashDados: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'sentido_texto', type: 'varchar', length: 20, nullable: true })
  sentidoTexto: string;

  @Column({ name: 'periodo_do_dia', type: 'varchar', length: 20, nullable: true })
  periodoDoDia: string;

  @Column({ name: 'tem_cobrador', type: 'boolean', default: false })
  temCobrador: boolean;

  @Column({ name: 'origem_dados', type: 'varchar', length: 20, default: 'ORACLE_GLOBUS' })
  origemDados: string;

  @Column({ name: 'is_ativo', type: 'boolean', default: true })
  isAtivo: boolean;
}
