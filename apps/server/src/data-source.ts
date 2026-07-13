import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { entities } from './database/entities';

// Load apps/server/.env when running typeorm CLI via ts-node.
loadEnv({ path: __dirname + '/../.env' });

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  timezone: 'Z',
  entities,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  logging: process.env.NODE_ENV === 'development',
});
