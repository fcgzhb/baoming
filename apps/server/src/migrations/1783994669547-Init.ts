import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1783994669547 implements MigrationInterface {
    name = 'Init1783994669547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`participants\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`order_id\` bigint UNSIGNED NOT NULL, \`name\` varchar(64) NOT NULL, \`id_card_type\` varchar(16) NOT NULL, \`id_card\` varchar(64) NOT NULL, \`phone\` varchar(20) NULL, \`relation\` varchar(32) NULL, \`emergency_name\` varchar(64) NULL, \`emergency_phone\` varchar(20) NULL, \`school_grade\` varchar(128) NULL, \`remark\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`uk_participants_order\` (\`order_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`consent_records\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`user_id\` bigint UNSIGNED NOT NULL, \`consent_type\` varchar(32) NOT NULL, \`policy_version\` varchar(16) NOT NULL, \`consented_at\` datetime NOT NULL, INDEX \`idx_consent_user\` (\`user_id\`, \`consent_type\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`audit_logs\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`actor_type\` varchar(16) NOT NULL, \`actor_id\` bigint UNSIGNED NULL, \`action\` varchar(64) NOT NULL, \`target_type\` varchar(32) NULL, \`target_id\` bigint UNSIGNED NULL, \`amount\` decimal(10,2) NULL, \`meta\` json NULL, \`created_at\` datetime NOT NULL, INDEX \`idx_audit_actor\` (\`actor_type\`, \`actor_id\`), INDEX \`idx_audit_target\` (\`target_type\`, \`target_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_a4de504482b1a22228f331fccfa\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_a4de504482b1a22228f331fccfa\``);
        await queryRunner.query(`DROP INDEX \`idx_audit_target\` ON \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`idx_audit_actor\` ON \`audit_logs\``);
        await queryRunner.query(`DROP TABLE \`audit_logs\``);
        await queryRunner.query(`DROP INDEX \`idx_consent_user\` ON \`consent_records\``);
        await queryRunner.query(`DROP TABLE \`consent_records\``);
        await queryRunner.query(`DROP INDEX \`uk_participants_order\` ON \`participants\``);
        await queryRunner.query(`DROP TABLE \`participants\``);
    }

}
