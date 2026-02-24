import { UserRole, UserStatus } from '../../common/types';

export class User {
  user_id: string;
  cognito_username?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}
