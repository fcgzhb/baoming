import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeParticipantOrderIdNullable1783997932733 implements MigrationInterface {
    name = 'MakeParticipantOrderIdNullable1783997932733'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_a4de504482b1a22228f331fccfa\``);
        await queryRunner.query(`ALTER TABLE \`participants\` CHANGE \`order_id\` \`order_id\` bigint UNSIGNED NULL`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_a4de504482b1a22228f331fccfa\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_a4de504482b1a22228f331fccfa\``);
        await queryRunner.query(`ALTER TABLE \`participants\` CHANGE \`order_id\` \`order_id\` bigint UNSIGNED NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_a4de504482b1a22228f331fccfa\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
