import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  AdminAuthContext,
  defaultAdminAuthState,
  resolveAdminGate,
  type AdminAuthActions,
  type AdminAuthState,
} from "./adminAuthContext";
import { subscribeToAdminAuth } from "./adminAuthSession";
import { hasE2EAdminSessionOverride, readE2EAdminSession } from "./e2eAdminSession";

export type AdminAuthProviderProps = PropsWithChildren<{
  initialState?: AdminAuthState;
}>;

const loadAdminAuthProviders = () => import("./adminAuthProviders");

export const AdminAuthProvider = ({
  children,
  initialState,
}: AdminAuthProviderProps) => {
  const isControlled = initialState !== undefined;
  const [state, setState] = useState<AdminAuthState>(
    initialState ?? { ...defaultAdminAuthState, loading: true },
  );

  useEffect(() => {
    if (isControlled) {
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const start = async () => {
      const stop = await subscribeToAdminAuth((nextState) => {
        if (cancelled) {
          return;
        }

        setState(nextState);
      });
      if (cancelled) {
        stop();
        return;
      }
      unsubscribe = stop;
    };

    void start();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isControlled]);

  const signInWithGoogle = useCallback(async () => {
    const { signInAdminWithGoogle } = await loadAdminAuthProviders();
    await signInAdminWithGoogle();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { signInAdminWithEmail } = await loadAdminAuthProviders();
    await signInAdminWithEmail(email, password);
  }, []);

  const signOut = useCallback(async () => {
    if (hasE2EAdminSessionOverride()) {
      setState({
        configured: true,
        loading: false,
        user: null,
        admin: false,
        apiForbidden: false,
      });
      return;
    }

    try {
      const { signOutAdmin } = await loadAdminAuthProviders();
      await signOutAdmin();
    } finally {
      setState((current) => ({
        ...current,
        user: null,
        admin: false,
        apiForbidden: false,
        loading: false,
      }));
    }
  }, []);

  const getIdToken = useCallback(async (forceRefresh = false) => {
    if (hasE2EAdminSessionOverride()) {
      return readE2EAdminSession()?.idToken ?? null;
    }

    if (isControlled) {
      return state.user ? "test-admin-token" : null;
    }

    const { getAdminIdToken } = await loadAdminAuthProviders();
    return getAdminIdToken(forceRefresh);
  }, [isControlled, state.user]);

  const handleUnauthorized = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const handleForbidden = useCallback(() => {
    setState((current) => ({
      ...current,
      apiForbidden: true,
    }));
  }, []);

  const authActions: AdminAuthActions = useMemo(
    () => ({
      signInWithGoogle,
      signInWithEmail,
      signOut,
      getIdToken,
      handleUnauthorized,
      handleForbidden,
    }),
    [
      getIdToken,
      handleForbidden,
      handleUnauthorized,
      signInWithEmail,
      signInWithGoogle,
      signOut,
    ],
  );

  const value = useMemo(
    () => ({
      ...state,
      ...authActions,
      gate: resolveAdminGate(state),
    }),
    [authActions, state],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
};
