import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Admin } from '../database/entities/admin.entity';
import { hashPassword } from '../common/utils/password.util';

/**
 * Seed the first admin from env:
 *   pnpm --filter @baoming/server seed:admin
 * Reads SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD / SEED_ADMIN_DISPLAY_NAME.
 */
async function main() {
  loadEnv({ path: __dirname + '/../.env' });
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'error', 'warn'] });

  const repo = app.get<Repository<Admin>>(getRepositoryToken(Admin));
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';

  const existing = await repo.findOne({ where: { username } });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`[seed] admin "${username}" already exists — skipping.`);
    await app.close();
    return;
  }

  const password = process.env.SEED_ADMIN_PASSWORD ?? 'change-me';
  const admin = repo.create({
    username,
    passwordHash: await hashPassword(password),
    displayName: process.env.SEED_ADMIN_DISPLAY_NAME ?? '超管',
    status: 1,
  });
  await repo.save(admin);
  // eslint-disable-next-line no-console
  console.log(`[seed] created admin "${username}" (please change the password).`);
  await app.close();
}

void main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed:', err);
  process.exit(1);
});
