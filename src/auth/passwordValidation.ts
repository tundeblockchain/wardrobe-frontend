export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): string | undefined => {
  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0) {
    return "Enter your email address.";
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return "Enter a valid email address.";
  }

  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (password.length === 0) {
    return "Enter a password.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return undefined;
};

export const validatePasswordConfirmation = (
  password: string,
  confirmation: string,
): string | undefined => {
  if (confirmation.length === 0) {
    return "Confirm your password.";
  }

  if (confirmation !== password) {
    return "Passwords do not match.";
  }

  return undefined;
};
