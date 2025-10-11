import Fastify from 'fastify'
import { setUserRoutes } from './routes/usuarioRoutes'
import { UsuarioController } from './controllers/usuarioController';

export const buildServer =  (logger = false) => {
  let app = Fastify({ logger })

  setUserRoutes(app, new UsuarioController());

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
