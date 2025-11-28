import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLogAlteracaoFrqToBcoItens1764000000001 implements MigrationInterface {
  name = 'AddLogAlteracaoFrqToBcoItens1764000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bco_alteracoes_itens" ADD COLUMN IF NOT EXISTS "log_alteracao_frq" VARCHAR(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bco_alteracoes_itens" DROP COLUMN IF EXISTS "log_alteracao_frq"`);
  }
}

