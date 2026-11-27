export interface IAuthService {

    createUser(user: {email: string, password: string, username: string}): Promise<{id: string, message: string}>;
    
}