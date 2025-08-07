import { UserDocument } from 'src/users/schemas/user.schema';

export type Payload = { email: string; sub: string };
export type UserWithoutPassword = Omit<UserDocument, 'password'>;
