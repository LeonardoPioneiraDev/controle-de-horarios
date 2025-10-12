import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('controle_horarios')
@Index(['dataReferencia', 'codigoLinha'])
@Index(['dataReferencia', 'viagemGlobusId'])
export class ControleHorario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Referência à viagem Globus
  @Column({ name: 'viagem_globus_id', length: 50 })
  @Index()
  viagemGlobusId: string;

  // Dados de contexto para facilitar consultas
  @Column({ name: 'data_referencia', length: 10 })
  dataReferencia: string; // YYYY-MM-DD

  @Column({ name: 'codigo_linha', length: 20 })
  codigoLinha: string;

  @Column({ name: 'nome_linha', length: 300, nullable: true })
  nomeLinha: string;

  @Column({ name: 'cod_servico_numero', length: 20, nullable: true })
  codServicoNumero: string;

  @Column({ name: 'sentido_texto', length: 20, nullable: true })
  sentidoTexto: string;

  @Column({ name: 'setor_principal', length: 50, nullable: true })
  setorPrincipal: string;

  // CAMPOS EDITÁVEIS PELO USUÁRIO
  @Column({ name: 'numero_carro', length: 50, nullable: true })
  numeroCarro: string;

  @Column({ name: 'informacao_recolhe', length: 300, nullable: true })
  informacaoRecolhe: string;

  @Column({ name: 'cracha_funcionario', length: 50, nullable: true })
  crachaFuncionario: string;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  // Campos adicionais para controle operacional
  @Column({ name: 'horario_saida', length: 8, nullable: true })
  horarioSaida: string;

  @Column({ name: 'horario_chegada', length: 8, nullable: true })
  horarioChegada: string;

  @Column({ name: 'nome_motorista', length: 200, nullable: true })
  nomeMotorista: string;

  @Column({ name: 'local_origem', length: 200, nullable: true })
  localOrigem: string;

  // Auditoria
  @Column({ name: 'usuario_edicao', length: 500 }) // ✅ ATUALIZADO: 500
  usuarioEdicao: string;

  @Column({ name: 'usuario_email', length: 500, nullable: true }) // ✅ ATUALIZADO: 500
  usuarioEmail: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}