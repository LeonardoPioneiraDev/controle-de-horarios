import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1728550000001 implements MigrationInterface {
  name = 'CreateInitialTables1728550000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tipos ENUM
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM(
        'administrador', 
        'diretor', 
        'gerente', 
        'analista', 
        'operador'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "user_status_enum" AS ENUM(
        'pending', 
        'active', 
        'inactive', 
        'blocked'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "log_level_enum" AS ENUM(
        'error', 
        'warn', 
        'info', 
        'debug'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "log_context_enum" AS ENUM(
        'auth', 
        'user', 
        'email', 
        'system', 
        'database'
      )
    `);

    // Criar tabela users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'operador',
        "status" "user_status_enum" NOT NULL DEFAULT 'pending',
        "email_verified" boolean NOT NULL DEFAULT false,
        "email_verification_token" character varying(255),
        "password_reset_token" character varying(255),
        "password_reset_expires" TIMESTAMP,
        "last_login" TIMESTAMP,
        "login_attempts" integer NOT NULL DEFAULT 0,
        "locked_until" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Criar tabela system_logs
    await queryRunner.query(`
      CREATE TABLE "system_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "level" "log_level_enum" NOT NULL,
        "message" text NOT NULL,
        "context" "log_context_enum",
        "user_id" uuid,
        "ip_address" character varying(45),
        "user_agent" text,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_system_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Criar índices
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_status" ON "users" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX "IDX_system_logs_level" ON "system_logs" ("level")`);
    await queryRunner.query(`CREATE INDEX "IDX_system_logs_context" ON "system_logs" ("context")`);
    await queryRunner.query(`CREATE INDEX "IDX_system_logs_created_at" ON "system_logs" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_system_logs_user_id" ON "system_logs" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX "IDX_system_logs_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_system_logs_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_system_logs_context"`);
    await queryRunner.query(`DROP INDEX "IDX_system_logs_level"`);
    await queryRunner.query(`DROP INDEX "IDX_users_role"`);
    await queryRunner.query(`DROP INDEX "IDX_users_status"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);

    // Remover tabelas
    await queryRunner.query(`DROP TABLE "system_logs"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Remover tipos ENUM
    await queryRunner.query(`DROP TYPE "log_context_enum"`);
    await queryRunner.query(`DROP TYPE "log_level_enum"`);
    await queryRunner.query(`DROP TYPE "user_status_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}