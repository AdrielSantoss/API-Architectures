import { FastifyInstance } from "fastify";
import { UsuarioController } from "../controllers/usuarioController";

export function setUsariosRoutes(app: FastifyInstance, userController: UsuarioController) { 
    app.get(
        '/usuarios', 
        { // Todo: Maybe move to another function
            schema: {
                    querystring: {
                        type: 'object',
                        properties: {
                            page: { type: 'integer', minimum: 1, default: 1 },
                            limit: { type: 'integer', minimum: 1, maximum: 10, default: 10 }
                        }
                }
            }
        }, 
        async (request, reply) => userController.getUsuarios(request, reply)
    )
        
    app.get('/usuarios/:id', async () => userController.getUsuarioById())
}