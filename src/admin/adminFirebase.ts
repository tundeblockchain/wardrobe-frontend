import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getAdminFirebaseWebConfig } from "../config/env";

export const getAdminFirebaseApp = (): FirebaseApp => {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(getAdminFirebaseWebConfig());
};

export const getAdminFirebaseAuth = (): Auth => {
  return getAuth(getAdminFirebaseApp());
};
