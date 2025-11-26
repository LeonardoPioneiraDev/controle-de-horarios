import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddAutoLoginToUsers1732619881000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar coluna auto_login_enabled
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'auto_login_enabled',
                type: 'boolean',
                default: false,
                isNullable: false,
            }),
        );

        // Adicionar coluna auto_login_token
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'auto_login_token',
                type: 'varchar',
                length: '255',
                isNullable: true,
                isUnique: true,
            }),
        );

        // Criar índice único no auto_login_token
        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_users_auto_login_token',
                columnNames: ['auto_login_token'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover índice
        await queryRunner.dropIndex('users', 'IDX_users_auto_login_token');

        // Remover colunas
        await queryRunner.dropColumn('users', 'auto_login_token');
        await queryRunner.dropColumn('users', 'auto_login_enabled');
    }
}
