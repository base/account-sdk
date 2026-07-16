/**
 * Easy Account Access Utilities Export
 * Main entry point for all easy access functionality
 */

export {
  createEasyAccessClient,
  generateAccessToken,
  validateAccessToken,
  easyLogin,
  easyLogout,
  getCurrentSession,
  tokenCache,
} from './easyAccess';

export type { AccessToken } from './easyAccess';

// Default export for convenience
import * as easyAccess from './easyAccess';
export default easyAccess;
