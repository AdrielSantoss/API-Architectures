import request from 'supertest'
import { buildServer } from '../index'

describe('GET /', () => {
  let app: ReturnType<typeof buildServer>

  beforeAll(async () => {
    app = buildServer()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return 200 and hello world', async () => {
    const response = await request(app.server).get('/')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ hello: 'world' })
  })
})
