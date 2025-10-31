import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@/users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);