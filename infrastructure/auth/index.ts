/**
 * Infrastructure — Auth Barrel
 */

export {
  signIn,
  signOut,
  getSession,
  getAuthUser,
  getCachedUserProfile,
  getAuthenticatedActor,
  verifySessionTokenInCache,
  setSessionTokenInCache,
  clearAuthCache,
  clearUserAuthCache,
} from './auth-service';

export type { AuthActorOptions } from './auth-service';

