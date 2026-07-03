/**
 * Domain — Business Rules Barrel
 */

export {
  isValidStatusTransition,
  canSignIn,
  isValidEmail,
  isValidUsername,
  isDeleted,
} from './UserRules';

export {
  canAssignRole,
  canModifyUser,
  canWrite,
  canManageUsers,
} from './RoleRules';

export {
  isEditable,
  isValidSettingValue,
  SETTING_KEYS,
} from './SettingRules';

export { detectDuplicates } from './ContactRules';
export type { DuplicateCheckInput } from './ContactRules';
export { isValidTransition as isValidTaskTransition } from './TaskRules';

