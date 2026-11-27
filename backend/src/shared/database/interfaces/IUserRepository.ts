import { dtoUser } from "../../interfaces/dto.js";

export interface IUserRepository {

    createUser(user: dtoUser): Promise<{id: string, message: string}>;

}