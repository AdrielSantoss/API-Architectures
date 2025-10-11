import Fastify from 'fastify'

export const buildServer = (logger = false) => {
  const app = Fastify({ logger })

  app.get('/', async () => ({ hello: 'world' }))

  return app
}

if (require.main === module) {
  const app = buildServer(true) 

  app.listen({ port: 3000 }, (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    
    console.log(`Server running at ${address}`)
  })
}
