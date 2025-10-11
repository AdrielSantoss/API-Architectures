import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/userController";

export function setUserRoutes(app: FastifyInstance, userController: UserController) {
    app.get('/users', async (request, reply) => userController.getUsers(request, reply))
    app.get('/users/:id', async () => userController.getUserById())
}