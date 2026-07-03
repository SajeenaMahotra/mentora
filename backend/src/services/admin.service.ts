import { userRepository } from "../repositories/user.repository";
import { ValidationError, ConflictError } from "../errors/AppError";
import { AccountStatus } from "../models/user.model";

interface ListUsersParams {
  page: number;
  limit: number;
  role?: string;
  status?: AccountStatus;
  search?: string;
}

export const adminService = {
  async listUsers(params: ListUsersParams) {
    return userRepository.findAllPaginated(params);
  },

  async updateUserStatus(id: string, status: AccountStatus, actingAdminId: string) {
    if (id === actingAdminId) {
      throw new ConflictError("Admins cannot change their own account status");
    }

    const user = await userRepository.findById(id);
    if (!user) throw new ValidationError("User not found");
    if (user.isDeleted) throw new ValidationError("User not found");

    return userRepository.updateStatus(id, status);
  },

  async deleteUser(id: string, actingAdminId: string) {
    if (id === actingAdminId) {
      throw new ConflictError("Admins cannot delete their own account");
    }

    const user = await userRepository.findById(id);
    if (!user) throw new ValidationError("User not found");
    if (user.isDeleted) throw new ValidationError("User already deleted");

    return userRepository.softDelete(id);
  },
};