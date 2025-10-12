import { FastifyInstance } from "fastify";
import { UsuarioController } from "../controllers/usuarioController";

export function setUsariosRoutes(app: FastifyInstance, userController: UsuarioController) {
    app.get('/usuarios', async (request, reply) => userController.getUsuarios(request, reply))
    app.get('/usuarios/:id', async () => userController.getUsuarioById())
}