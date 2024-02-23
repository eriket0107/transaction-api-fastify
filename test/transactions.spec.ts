import { execSync } from 'node:child_process'

import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { app } from '../src/app'

describe('Transaction routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('pnpm knex migrate:rollback --all')
    execSync('pnpm knex migrate:latest')
  })

  it('should be able to create new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Test transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list one transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Test transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get(`/transactions`)
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'Test transaction',
        amount: 5000,
      }),
    )
  })

  it('should be able to list all user transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Test transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'Test transaction',
        amount: 5000,
      }),
    ])
  })

  it('should be able to get summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Test transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)

    const cookies = createTransactionResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Test transaction',
        amount: 2000,
        type: 'debit',
      })
      .expect(201)

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    })
  })
})
