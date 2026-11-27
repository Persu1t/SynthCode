import { Expose, Transform } from "class-transformer";
import {
  ObjectIdToString,
  StringToObjectId,
} from "../../../../shared/constants/transformerConstants.js";
import { IUser, UserRole } from "../../../../shared/interfaces/model.js";
import { ObjectId } from "mongodb";

class User implements IUser {
    @Transform(ObjectIdToString.transformer, { toPlainOnly: true })
    @Transform(StringToObjectId.transformer, { toClassOnly: true })
    @Expose()
    _id: ObjectId | null;

    @Expose()
    email: string;

    @Expose()
    password: string;

    @Expose()
    username: string;

    @Expose()
    verified: boolean;

    @Expose()
    role: UserRole;

    @Expose()
    isBlocked: boolean;

    @Expose()
    createdAt?: Date;

    @Expose()
    updatedAt?: Date;

    constructor(data:IUser){
        this._id = data?._id ? new ObjectId(data._id) : null;
        this.email= data.email;
        this.password= data.password;
        this.role= data.role;
        this.username= data.username;
        this.isBlocked= data.isBlocked;
        this.verified= data.verified;
        this.createdAt= new Date();
        this.updatedAt= new Date();
    }
}

export { User }