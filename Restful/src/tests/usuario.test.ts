import { buildServer } from '../index'
import 'dotenv/config';
import { UsuariosDto } from '../models/usuarioDto';

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
    const limit = 1;
    const page = 1;

    const response = await app.inject({
      method: 'GET',
      url: `/usuarios?page=${page}&limit=${limit}`
    })

    const data = JSON.parse(response.body) as UsuariosDto;

    expect(response.statusCode).toBe(200)
    expect(data.data![0].nome).toBe('Alice')
    
    expect(data.data!.length).toBe(limit)
    expect(data.meta.limit).toBe(limit)
    expect(data.meta.page).toBe(page)
    expect(data.meta.hasNextPage).toBe(true)
  })
})
