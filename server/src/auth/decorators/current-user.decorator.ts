import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDto } from '../dto/user.dto';

/**
 * Extracts the current user from the execution context.
 *
 * @param context - The execution context from which the request is accessed.
 * @returns The user object extracted from the request.
 */
const getCurrentUserByContext = (context: ExecutionContext) => {
  const user = context.switchToHttp().getRequest<{ user: { _doc: UserDto } }>()
    .user._doc;
  //console.log(user);
  return user;
};

export const CurrentUser = createParamDecorator<unknown, UserDto>(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentUserByContext(context),
);

// export const CurrentUserId = createParamDecorator(
//   (_data: unknown, context: ExecutionContext) =>
//     getCurrentUserByContexxt(context)._id,
// );
