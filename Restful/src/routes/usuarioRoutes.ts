import { FastifyInstance } from "fastify";
import { UsuarioController } from "../controllers/usuarioController";

export function setUserRoutes(app: FastifyInstance, userController: UsuarioController) {
    app.get('/users', async (request, reply) => userController.getUsuarios(request, reply))
    app.get('/users/:id', async () => userController.getUsuarioById())
}