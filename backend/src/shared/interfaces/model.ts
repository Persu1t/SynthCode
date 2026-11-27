import { ObjectId } from "mongodb";

export enum UserRole {
    ADMIN = "admin",
    USER = "user",
}

export interface IUser {
    _id?: ObjectId | null;
    email: string;
    password: string;
    username: string;
    verified: boolean;
    role: UserRole;
    isBlocked: boolean;
}