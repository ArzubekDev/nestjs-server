import { applyDecorators, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "./roles.decorators";
import { AuthGuard } from "src/guards/auth.guard";
import { RolesGuard } from "src/guards/roles.guard";

export function Authorization(...roles: Role[]) {
    if(roles.length > 0){
        return applyDecorators(
            Roles(...roles),
            UseGuards(AuthGuard, RolesGuard)
        )
    }
    return applyDecorators(UseGuards(AuthGuard))
}