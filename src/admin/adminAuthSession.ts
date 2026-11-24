import { hasAdminFirebaseWebConfig } from "../config/env";
import {
  isAdminClaim,
  type AdminAuthState,
  type AdminUser,
} from "./adminAuthContext";
import {
  hasE2EAdminSessionOverride,
  readE2EAdminSession,
} from "./e2eAdminSession";

export type AdminAuthSnapshotListener = (state: AdminAuthState) => void;

const loadFirebaseAuth = () => import("firebase/auth");
const loadAdminFirebase = () => import("./adminFirebase");

const mapFirebaseUser = (firebaseUser: {
  uid: string;
  email: string | null;
}): AdminUser => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
  };
};

export const subscribeToAdminAuth = async (
  onChange: AdminAuthSnapshotListener,
): Promise<() => void> => {
  if (hasE2EAdminSessionOverride()) {
    const session = readE2EAdminSession();
    onChange({
      configured: true,
      loading: false,
      user: session?.user ?? null,
      admin: session?.admin === true,
      apiForbidden: false,
    });
    return () => undefined;
  }

  if (!hasAdminFirebaseWebConfig()) {
    onChange({
      configured: false,
      loading: false,
      user: null,
      admin: false,
      apiForbidden: false,
    });
    return () => undefined;
  }

  onChange({
    configured: true,
    loading: true,
    user: null,
    admin: false,
    apiForbidden: false,
  });

  const [{ onAuthStateChanged }, { getAdminFirebaseAuth }] = await Promise.all([
    loadFirebaseAuth(),
    loadAdminFirebase(),
  ]);

  return onAuthStateChanged(getAdminFirebaseAuth(), (firebaseUser) => {
    if (!firebaseUser) {
      onChange({
        configured: true,
        loading: false,
        user: null,
        admin: false,
        apiForbidden: false,
      });
      return;
    }

    void firebaseUser.getIdTokenResult().then((tokenResult) => {
      onChange({
        configured: true,
        loading: false,
        user: mapFirebaseUser(firebaseUser),
        admin: isAdminClaim(tokenResult.claims.admin),
        apiForbidden: false,
      });
    });
  });
};
