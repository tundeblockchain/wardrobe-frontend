export const DEFAULT_AUTH_ERROR_MESSAGE =
  "Something went wrong. Please try again.";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-login-credentials": "Incorrect email or password.",
  "auth/email-already-in-use": "An account already exists with that email.",
  "auth/weak-password": "Password is too weak.",
  "auth/missing-password": "Enter a password.",
  "auth/missing-email": "Enter your email address.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked": "The sign-in popup was blocked. Allow popups and try again.",
  "auth/account-exists-with-different-credential":
    "An account already exists with a different sign-in method.",
  "auth/operation-not-allowed": "This sign-in method is not enabled.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again.",
  "auth/requires-recent-login": "Please sign in again to continue.",
  "auth/invalid-action-code": "This reset link is invalid or has expired.",
  "auth/expired-action-code": "This reset link has expired.",
  "auth/internal-error": DEFAULT_AUTH_ERROR_MESSAGE,
};

const getErrorCode = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = error.code;
  if (typeof code !== "string" || code.trim().length === 0) {
    return undefined;
  }

  return code;
};

export const getAuthErrorMessage = (error: unknown): string => {
  const code = getErrorCode(error);
  if (!code) {
    return DEFAULT_AUTH_ERROR_MESSAGE;
  }

  return AUTH_ERROR_MESSAGES[code] ?? DEFAULT_AUTH_ERROR_MESSAGE;
};
