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
} from './auth-service';
export type { AuthActorOptions } from './auth-service';

