// src/entities/controle-horario.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { createHash } from 'crypto';
import { ControleHorarioChange } from './controle-horario-change.entity';

@Entity('controle_horarios')
@Index(['data_referencia', 'codigo_linha'], { unique: false })
@Index(['data_referencia', 'setor_principal_linha'], { unique: false })
@Index(['data_referencia', 'cod_servico_numero'], { unique: false })
@Index(['data_referencia', 'nome_motorista'], { unique: false })
@Index(['hash_dados'], { unique: true })
// Índices para acelerar filtros de “editados por” e confirmados
@Index(['data_referencia', 'editado_por_email'], { unique: false })
@Index(['data_referencia', 'de_acordo'], { unique: false })
@Index(['data_referencia', 'prefixo_veiculo'], { unique: false })
export class ControleHorario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => ControleHorarioChange, change => change.controleHorario)
  historico: ControleHorarioChange[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  setor_principal_linha: string;

  @Column({ type: 'integer', nullable: true })
  cod_local_terminal_sec: number;

  @Column({ type: 'varchar', length: 20, nullable: false, default: '' })
  codigo_linha: string;

  @Column({ type: 'varchar', length: 200, nullable: false, default: '' })
  nome_linha: string;

  @Column({ type: 'integer', nullable: true })
  cod_destino_linha: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  local_destino_linha: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  flg_sentido: string;

  @Column({ type: 'date', nullable: true })
  data_viagem: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  desc_tipodia: string;

  @Column({ type: 'timestamp', nullable: true })
  hor_saida: Date;

  @Column({ type: 'timestamp', nullable: true })
  hor_chegada: Date;

  // Horários ajustados pelo usuário (quando diferem do previsto)
  @Column({ type: 'timestamp', nullable: true })
  hor_saida_ajustada: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  hor_chegada_ajustada: Date | null;

  @Column({ type: 'integer', nullable: true })
  cod_origem_viagem: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  local_origem_viagem: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cod_servico_completo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cod_servico_numero: string;

  @Column({ type: 'integer', nullable: true })
  cod_atividade: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nome_atividade: string;

  @Column({ type: 'varchar', length: 1, nullable: true })
  flg_tipo: string;

  @Column({ type: 'integer', nullable: true })
  cod_motorista: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nome_motorista: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cracha_motorista: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  chapa_func_motorista: string;

  @Column({ type: 'integer', nullable: true })
  cod_cobrador: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nome_cobrador: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cracha_cobrador: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  chapa_func_cobrador: string;

  @Column({ type: 'integer', nullable: true })
  total_horarios: number;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'placaVeiculo' })
  placaVeiculo: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'garagemVeiculo' })
  garagemVeiculo: string;

  // Campos para edição e controle
  @Column({ type: 'varchar', length: 10, nullable: true })
  prefixo_veiculo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  motorista_substituto_nome: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  motorista_substituto_cracha: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cobrador_substituto_nome: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  cobrador_substituto_cracha: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observacoes_edicao: string;

  // Motivo de atraso e observação livre do usuário
  @Column({ type: 'varchar', length: 30, nullable: true })
  atraso_motivo: string | null; // ENGARRAFAMENTO | ACIDENTE | QUEBRA_OU_DEFEITO | DIVERSOS

  @Column({ type: 'varchar', length: 500, nullable: true })
  atraso_observacao: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  editado_por_nome: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  editado_por_email: string;

  // Campos de controle
  @Column({ type: 'varchar', length: 10 })
  data_referencia: string;

  @Column({ type: 'varchar', length: 64 })
  hash_dados: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Aprovação do usuário para a viagem (quando estiver de acordo)
  @Column({ type: 'boolean', default: false })
  de_acordo: boolean;

  // Momento em que foi marcada como "de acordo" (usado para ocultar após 30s)
  @Column({ type: 'timestamp', nullable: true })
  de_acordo_em: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sentido_texto: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  periodo_do_dia: string;

  @Column({ type: 'boolean', default: false })
  tem_cobrador: boolean;

  @Column({ type: 'varchar', length: 20, default: 'ORACLE_GLOBUS' })
  origem_dados: string;

  @Column({ type: 'boolean', default: true })
  is_ativo: boolean;

  // Método para gerar o hash dos dados
  gerarHashDados(): string {
    const dadosParaHash = [
      this.data_referencia,
      this.cod_local_terminal_sec,
      this.codigo_linha,
      this.flg_sentido,
      this.cod_servico_completo,
      this.hor_saida?.toISOString() || '',
      this.cod_motorista,
      this.cod_cobrador,
      this.cod_atividade,
      this.flg_tipo,
      this.prefixo_veiculo,
    ].join('|');

    return createHash('sha256').update(dadosParaHash).digest('hex');
  }
}
