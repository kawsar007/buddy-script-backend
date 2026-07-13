import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * @example @Roles(Role.ADMIN) @Get('admin/stats')
 * Pair with RolesGuard (registered per-controller where needed).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
