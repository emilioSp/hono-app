import knex, { type Knex } from 'knex';
import { config } from '#config';

export const configDB = {
  client: 'postgresql',
  connection: {
    host: config.POSTGRES_HOST,
    port: config.POSTGRES_PORT,
    user: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
    database: config.POSTGRES_DB,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
};

export const db = knex(configDB);

export const getDB = (trx?: Knex.Transaction) => trx ?? db;
