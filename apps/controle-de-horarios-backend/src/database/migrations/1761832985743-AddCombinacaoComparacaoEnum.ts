import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCombinacaoComparacaoEnum1761832985743 implements MigrationInterface {
    name = 'AddCombinacaoComparacaoEnum1761832985743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_viagem_globus_id"`);
        await queryRunner.query(`ALTER TABLE "controle_horarios" ALTER COLUMN "viagem_globus_id" SET NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0efb1d39ed772fd02383cb6c7c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a15709f1fc3ca1ea99e71e000e"`);
        await queryRunner.query(`ALTER TYPE "public"."comparacao_viagens_status_comparacao_enum" RENAME TO "comparacao_viagens_status_comparacao_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."comparacao_viagens_status_comparacao_enum" AS ENUM('compativel', 'divergente', 'apenas_transdata', 'apenas_globus', 'horario_divergente')`);
        await queryRunner.query(`ALTER TABLE "comparacao_viagens" ALTER COLUMN "status_comparacao" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "comparacao_viagens" ALTER COLUMN "status_comparacao" TYPE "public"."comparacao_viagens_status_comparacao_enum" USING "status_comparacao"::"text"::"public"."comparacao_viagens_status_comparacao_enum"`);
        await queryRunner.query(`ALTER TABLE "comparacao_viagens" ALTER COLUMN "status_comparacao" SET DEFAULT 'divergente'`);
        await queryRunner.query(`DROP TYPE "public"."comparacao_viagens_status_comparacao_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."comparacao_viagens_tipo_combinacao_enum" RENAME TO "comparacao_viagens_tipo_combinacao_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."comparacao_viagens_tipo_combinacao_enum" AS ENUM('TUDO_IGUAL', 'SO_HORARIO_DIFERENTE', 'SO_SERVICO_DIFERENTE', 'SERVICO_E_HORARIO_DIFERENTES', 'SO_SENTIDO_DIFERENTE', 'SENTIDO_E_HORARIO_DIFERENTES', 'SENTIDO_E_SERVICO_DIFERENTES', 'SO_LINHA_IGUAL', 'SO_LINHA_DIFERENTE', 'LINHA_E_HORARIO_DIFERENTES', 'LINHA_E_SERVICO_DIFERENTES', 'SO_SENTIDO_IGUAL', 'LINHA_E_SENTIDO_DIFERENTES', 'SO_SERVICO_IGUAL', 'SO_HORARIO_IGUAL', 'TUDO_DIFERENTE')`);
        await queryRunner.query(`ALTER TABLE "comparacao_viagens" ALTER COLUMN "tipo_combinacao" TYPE "public"."comparacao_viagens_tipo_combinacao_enum" USING "tipo_combinacao"::"text"::"public"."comparacao_viagens_tipo_combinacao_enum"`);
        await queryRunner.query(`DROP TYPE "public"."comparacao_viagens_tipo_combinacao_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_550f722ce7433af20607516b89" ON "controle_horarios" ("viagem_globus_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c0dc09ea36e534265ecbb9e74a" ON "controle_horarios" ("data_referencia", "is_ativo") `);
        await queryRunner.query(`CREATE INDEX "IDX_4d8d09f089929513054a0107a3" ON "controle_horarios" ("data_referencia", "viagem_globus_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a15709f1fc3ca1ea99e71e000e" ON "comparacao_viagens" ("data_referencia", "tipo_combinacao") `);
        await queryRunner.query(`CREATE INDEX "IDX_0efb1d39ed772fd02383cb6c7c" ON "comparacao_viagens" ("data_referencia", "status_comparacao") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_0efb1d39ed772fd02383cb6c7c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a15709f1fc3ca1ea99e71e000e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4d8d09f089929513054a0107a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0dc09ea36e534265ecbb9e74a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_550f722ce7433af20607516b89"`);
        await queryRunner.query(`CREATE TYPE "public"."comparacao_viagens_tipo_combinacao_enum_old" AS ENUM('TUDO_IGUAL', 'SO_HORARIO_DIFERENTE', 'SO_SERVICO_DIFERENTE', 'SERVICO_E_HORARIO_DIFERENTES', 'SO_SENTIDO_DIFERENTE', 'SENTIDO_E_HORARIO_DIFERENTES', 'SENTIDO_E_SERVICO_DIFERENTES', 'SO_LINHA_IGUAL', 'SO_LINHA_DIFERENTE', 'LINHA_E_HORARIO_DIFERENTES', 'LINHA_E_SERVICO_DIFERENTES', 'SO_SENTIDO_IGUAL', 'LINHA_E_SENTIDO_DIFERENTES', 'SO_SERVICO_IGUAL', 'SO_HORARIO_IGUAL', 'TUDO_DIFERENTE', 'todos_iguais', 'apenas_linha_diferente', 'apenas_sentido_diferente', 'apenas_servico_diferente', 'apenas_horario_diferente', 'linha_sentido_diferentes', 'linha_servico_diferentes', 'linha_horario_diferentes', 'sentido_servico_diferentes', 'sentido_horario_diferentes', 'servico_horario_diferentes', 'apenas_linha_igual', 'apenas_sentido_igual', 'apenas_servico_igual', 'apenas_horario_igual', 'todos_diferentes')`);
        await queryRunner.query(`ALTER TABLE "comparacao_viagens" ALTER COLUMN "tipo_combinacao" TYPE "public"."comparacao_viagens_tipo_combinacao_enum_old" USING "tipo_combinacao"::"text"::"public"."comparacao_viagens_tipo_combinacao_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."comparacao_viagens_tipo_combinacao_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."comparacao_viagens_tipo_combinacao_enum_old" RENAME TO "comparacao_viagens_tipo_combinacao_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."comparacao_viagens_status_comparacao_enum_old" AS ENUM('divergente', 'compativel', 'horario_divergente', 'servico_divergente', 'sentido_divergente', 'linha_divergente', 'servico_horario_divergente', 'sentido_horario_divergente', 'sentido_servico_divergente', 'linha_horario_divergente', 'linha_servico_divergente', 'linha_sentido_divergente', 'linha_sentido_servico_divergente', 'linha_sentido_horario_divergente', 'linha_servico_horario_divergente', 'sentido_servico_horario_divergente', 'multiplas_divergencias', 'apenas_transdata', 'apenas_globus', 'duplicado_transdata', 'duplicado_globus')`);
        await queryRunner.query(`ALTER TABLE "comparacao_viagens" ALTER COLUMN "status_comparacao" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "comparacao_viagens" ALTER COLUMN "status_comparacao" TYPE "public"."comparacao_viagens_status_comparacao_enum_old" USING "status_comparacao"::"text"::"public"."comparacao_viagens_status_comparacao_enum_old"`);
        await queryRunner.query(`ALTER TABLE "comparacao_viagens" ALTER COLUMN "status_comparacao" SET DEFAULT 'multiplas_divergencias'`);
        await queryRunner.query(`DROP TYPE "public"."comparacao_viagens_status_comparacao_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."comparacao_viagens_status_comparacao_enum_old" RENAME TO "comparacao_viagens_status_comparacao_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_a15709f1fc3ca1ea99e71e000e" ON "comparacao_viagens" ("data_referencia", "tipo_combinacao") `);
        await queryRunner.query(`CREATE INDEX "IDX_0efb1d39ed772fd02383cb6c7c" ON "comparacao_viagens" ("data_referencia", "status_comparacao") `);
        await queryRunner.query(`ALTER TABLE "controle_horarios" ALTER COLUMN "viagem_globus_id" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_viagem_globus_id" ON "controle_horarios" ("viagem_globus_id") `);
    }

}
