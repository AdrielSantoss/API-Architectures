import { User } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";

interface IUserController {
    getUsers(request: FastifyRequest, reply: FastifyReply): Promise<User[] | null>
    getUserById(): Promise<User | null>
    createUser(): Promise<undefined>
    updateUser(): Promise<User>
    patchUser(): Promise<undefined>
}

export class UserController implements IUserController {
    async getUsers(request: FastifyRequest, reply: FastifyReply): Promise<User[] | null> {
        return reply.send({ hello: 'world' });
    }

    async getUserById(): Promise<User | null> {
        throw new Error("Method not implemented.");
    }

    async createUser(): Promise<undefined> {
        throw new Error("Method not implemented.");
    }

    async updateUser(): Promise<User> {
        throw new Error("Method not implemented.");
    }

    async patchUser(): Promise<undefined> {
        throw new Error("Method not implemented.");
    }
}