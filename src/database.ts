import { Knex, knex as setupKnex } from 'knex'
import path from 'path'

import { env } from './env'

export const config: Knex.Config = {
  client: 'sqlite',
  connection: {
    filename: env.DATABASE_URL,
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: path.resolve('db', 'migrations'),
  },
}

export const knex = setupKnex(config)
