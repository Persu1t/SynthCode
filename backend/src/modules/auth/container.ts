import { ContainerModule } from "inversify";
import { AUTH_TYPES } from "./types.js";
import { AuthService } from "./service/AuthService.js";
import { UserRepository } from "../../shared/database/providers/mongo/repositories/UserRepository.js";
import { AuthController } from "./controller/AuthController.js";
import { GLOBAL_TYPES } from "../../types.js";

/** Bindings that are specific to the auth module. */
export const authContainerModule = new ContainerModule((options) => {
    options.bind(AUTH_TYPES.AuthService).to(AuthService).inSingletonScope();
    options.bind(GLOBAL_TYPES.UserRepository).to(UserRepository).inSingletonScope();
    options.bind(AuthController).toSelf().inSingletonScope();
})