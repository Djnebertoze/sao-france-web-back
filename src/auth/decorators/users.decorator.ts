import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	// Retrieves the current JWT user
	const request = ctx.switchToHttp().getRequest();
	return request.user;
});
