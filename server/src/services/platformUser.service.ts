import { findByIdForAdmin, findManyForAdmin, setUserActive } from "../repositories/platformUser.repository";
import { AppError } from "../utils/AppError";
import type { ListPlatformUsersQuery } from "../validators/platformUser.validator";

export async function listUsers(query: ListPlatformUsersQuery) {
  const { users, total } = await findManyForAdmin(query);

  return {
    users,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize))
    }
  };
}

export async function getUserDetails(userId: string) {
  const user = await findByIdForAdmin(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

async function assertExists(userId: string) {
  const user = await findByIdForAdmin(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }
}

export async function activateUser(userId: string) {
  await assertExists(userId);
  await setUserActive(userId, true);

  return getUserDetails(userId);
}

export async function deactivateUser(userId: string) {
  await assertExists(userId);
  await setUserActive(userId, false);

  return getUserDetails(userId);
}
