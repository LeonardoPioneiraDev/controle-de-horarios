import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('controle_horarios')
@Index(['dataReferencia', 'viagemGlobusId'])
@Index(['dataReferencia', 'isAtivo'])
export class ControleHorario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Referência à viagem Globus (COD_SERVICO_COMPLETO)
  @Column({ name: 'viagem_globus_id', length: 50, unique: true })
  @Index()
  viagemGlobusId: string;

  // Dados de contexto para facilitar consultas
  @Column({ name: 'data_referencia', length: 10 })
  dataReferencia: string; // YYYY-MM-DD (corresponds to DATA_VIAGEM from query)

  // CAMPOS DA CONSULTA GLOBUS
  @Column({ name: 'setor_principal_linha', nullable: true })
  setorPrincipalLinha: string;

  @Column({ name: 'cod_local_terminal_sec', type: 'numeric', nullable: true })
  codLocalTerminalSec: number;

  @Column({ name: 'codigo_linha', nullable: true })
  codigoLinha: string;

  @Column({ name: 'nome_linha', nullable: true })
  nomeLinha: string;

  @Column({ name: 'cod_destino_linha', nullable: true })
  codDestinoLinha: string;

  @Column({ name: 'local_destino_linha', nullable: true })
  localDestinoLinha: string;

  @Column({ name: 'flg_sentido', length: 1, nullable: true })
  flgSentido: string;

  @Column({ name: 'desc_tipo_dia', nullable: true })
  descTipoDia: string;

  @Column({ name: 'hora_saida', length: 5, nullable: true })
  horaSaida: string;

  @Column({ name: 'hora_chegada', length: 5, nullable: true })
  horaChegada: string;

  @Column({ name: 'cod_origem_viagem', nullable: true })
  codOrigemViagem: string;

  @Column({ name: 'local_origem_viagem', nullable: true })
  localOrigemViagem: string;

  @Column({ name: 'cod_servico_numero', nullable: true })
  codServicoNumero: string;

  @Column({ name: 'cod_atividade', type: 'numeric', nullable: true })
  codAtividade: number;

  @Column({ name: 'nome_atividade', nullable: true })
  nomeAtividade: string;

  @Column({ name: 'flg_tipo', length: 1, nullable: true })
  flgTipo: string;

  @Column({ name: 'cod_motorista', nullable: true })
  codMotorista: string;

  @Column({ name: 'nome_motorista_globus', nullable: true })
  nomeMotoristaGlobus: string;

  @Column({ name: 'cracha_motorista_globus', nullable: true })
  crachaMotoristaGlobus: string;

  @Column({ name: 'chapa_func_motorista_globus', nullable: true })
  chapaFuncMotoristaGlobus: string;

  @Column({ name: 'cod_cobrador', nullable: true })
  codCobrador: string;

  @Column({ name: 'nome_cobrador_globus', nullable: true })
  nomeCobradorGlobus: string;

  @Column({ name: 'cracha_cobrador_globus', nullable: true })
  crachaCobradorGlobus: string;

  @Column({ name: 'chapa_func_cobrador_globus', nullable: true })
  chapaFuncCobradorGlobus: string;

  @Column({ name: 'total_horarios', type: 'numeric', nullable: true })
  totalHorarios: number;

  // CAMPOS EDITÁVEIS PELO USUÁRIO
  @Column({ name: 'numero_carro', length: 50, nullable: true })
  numeroCarro: string;

  @Column({ name: 'nome_motorista_editado', nullable: true })
  nomeMotoristaEditado: string;

  @Column({ name: 'cracha_motorista_editado', nullable: true })
  crachaMotoristaEditado: string;

  @Column({ name: 'nome_cobrador_editado', nullable: true })
  nomeCobradorEditado: string;

  @Column({ name: 'cracha_cobrador_editado', nullable: true })
  crachaCobradorEditado: string;

  @Column({ name: 'observacoes', type: 'text', nullable: true }) // Consolidated observations field
  observacoes: string;

  // Auditoria
  @Column({ name: 'editor_id', type: 'varchar', length: 36, nullable: true }) // Consolidated editor ID
  editorId: string;

  @Column({ name: 'editor_nome', type: 'varchar', length: 100, nullable: true }) // Consolidated editor name
  editorNome: string;

  @Column({ name: 'editor_email', type: 'varchar', length: 100, nullable: true }) // Consolidated editor email
  editorEmail: string;

  @Column({ name: 'is_ativo', type: 'boolean', default: true })
  isAtivo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}