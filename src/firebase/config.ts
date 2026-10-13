import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirebaseWebConfig } from "../config/env";

export const getFirebaseApp = (): FirebaseApp => {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(getFirebaseWebConfig());
};

export const getFirebaseAuth = (): Auth => {
  return getAuth(getFirebaseApp());
};
