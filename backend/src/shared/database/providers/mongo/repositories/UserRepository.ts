import { Collection } from "mongodb";
import { IUserRepository } from "../../../interfaces/IUserRepository.js";
import { IUser, UserRole } from "../../../../interfaces/model.js";
import { GLOBAL_TYPES } from "../../../../../types.js";
import { inject, injectable } from "inversify";
import { MongoDatabase } from "../index.js";

@injectable()
export class UserRepository implements IUserRepository {
    private userCollection: Collection<IUser>;

    constructor(
        @inject(GLOBAL_TYPES.Database)
        private database: MongoDatabase
    ){}

    private async init(): Promise<void> {
        if(!this.userCollection) {
            this.userCollection = await this.database.getCollection<IUser>("users");

        }
    }

    private async ensureIndexes(){
        try {
            await this.userCollection.createIndex({ email: 1 }, { unique: true });
            await this.userCollection.createIndex({ username: 1 }, { unique: true });
        }catch(error){
            console.error("Error creating indexes:", error);
        }
    }

    async createUser(user: { email: string; password: string; username: string }): Promise<{id: string, message: string}> {
        await this.init();
        await this.ensureIndexes();
        const result = await this.userCollection.insertOne({
            ...user,
            verified: false,
            role: UserRole.USER,
            isBlocked: false,
        });
        if(result.insertedId === null){
            return { id: "null", message: "Something went wrong..."}
        }
        return { id: result.insertedId.toString(), message: "User created successfully" };
    }
}