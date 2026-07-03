/**
 * Application DTO — User
 *
 * Data transfer objects for the user across layers.
 */

export interface CurrentUserDto {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly username: string;
  readonly avatar: string | null;
  readonly roleName: string;
  readonly permissions: string[];
}

export interface UpdateUserProfileDto {
  readonly fullName?: string;
  readonly username?: string;
  readonly avatar?: string;
}
