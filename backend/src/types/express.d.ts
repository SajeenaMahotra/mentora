import { UserRole } from "./user.type";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
    };
    interface Request {
      googleAuthToken?: string;
      googleAuthUser?: {
        _id: string;
        fullname: string;
        email: string;
        role: UserRole;
        isProfileSetup: boolean;
        isNewUser: boolean;
      };
    }
  }
}

export { };