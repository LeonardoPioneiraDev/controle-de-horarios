import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateUserFiltersTable1764000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "user_filters",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "100"
                },
                {
                    name: "filters",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "tipoLocal",
                    type: "varchar",
                    length: "20",
                    isNullable: true
                },
                {
                    name: "statusEdicaoLocal",
                    type: "varchar",
                    length: "50",
                    isNullable: true
                },
                {
                    name: "user_id",
                    type: "uuid"
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }), true);

        await queryRunner.createForeignKey("user_filters", new TableForeignKey({
            columnNames: ["user_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE"
        }));

        await queryRunner.createIndex("user_filters", new TableIndex({
            name: "IDX_USER_FILTER_NAME_UNIQUE",
            columnNames: ["user_id", "name"],
            isUnique: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("user_filters");
    }
}
