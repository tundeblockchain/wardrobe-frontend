export const LOGIN_NOTICE_STORAGE_KEY = "pocket-closet.loginNotice";

export const setLoginNotice = (message: string): void => {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return;
  }

  sessionStorage.setItem(LOGIN_NOTICE_STORAGE_KEY, trimmedMessage);
};

export const consumeLoginNotice = (): string => {
  const message = sessionStorage.getItem(LOGIN_NOTICE_STORAGE_KEY)?.trim() ?? "";
  if (!message) {
    return "";
  }

  sessionStorage.removeItem(LOGIN_NOTICE_STORAGE_KEY);
  return message;
};
