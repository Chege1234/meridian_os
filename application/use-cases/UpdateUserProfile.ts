/**
 * Use Case — Update User Profile
 *
 * Updates the current user's profile fields.
 * Per BR-1404: validates before DB operation.
 */

import type { UserRepository } from '@/domain/repositories';
import type { UpdateUserProfileDto } from '@/application/dto';
import { isValidUsername } from '@/domain/rules';

interface Dependencies {
  userRepository: UserRepository;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function updateUserProfile(
  userId: string,
  data: UpdateUserProfileDto,
  deps: Dependencies,
): Promise<Result> {
  if (data.username && !isValidUsername(data.username)) {
    return {
      success: false,
      error: 'Username must be 3–100 characters, alphanumeric with underscores or hyphens.',
    };
  }

  const updated = await deps.userRepository.update(userId, {
    ...(data.fullName && { fullName: data.fullName }),
    ...(data.username && { username: data.username }),
    ...(data.avatar !== undefined && { avatar: data.avatar }),
  });

  if (!updated) {
    return { success: false, error: 'User not found.' };
  }

  return { success: true };
}
