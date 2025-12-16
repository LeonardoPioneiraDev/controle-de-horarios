import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChNotificationsIndexes202512160001 implements MigrationInterface {
  name = 'AddChNotificationsIndexes202512160001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ch_notifications_created_at ON ch_notifications (created_at)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ch_notifications_data_referencia ON ch_notifications (data_referencia)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ch_notifications_data_referencia`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_ch_notifications_created_at`);
  }
}

