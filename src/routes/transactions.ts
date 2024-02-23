import { randomUUID } from 'node:crypto'

import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export const transactionsRoutes = async (app: FastifyInstance) => {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions').where({
        session_id: sessionId,
      })

      return reply.status(200).send({ transactions })
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getTransactionParamSchema = z.object({
        id: z.string().uuid(),
      })
      const { id } = getTransactionParamSchema.parse(request.params)

      const { sessionId } = request.cookies

      const transaction = await knex('transactions')
        .where({ id, session_id: sessionId })
        .first()

      return reply.status(200).send({ transaction })
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies
      const summary = await knex('transactions')
        .where({ session_id: sessionId })
        .sum('amount', { as: 'amount' })
        .first()

      return reply.status(200).send({ summary })
    },
  )

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let { sessionId } = request.cookies

    if (!sessionId) {
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
