import {
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  AuthContext,
  AuthControllerContext,
  type AuthActions,
  type AuthState,
  type AuthUser,
} from "./authContext";

export type { AuthState, AuthUser } from "./authContext";

export type AuthProviderProps = PropsWithChildren<{
  initialState?: AuthState;
}>;

const loadAuthProviders = () => import("./authProviders");

export const AuthProvider = ({
  children,
  initialState,
}: AuthProviderProps) => {
  const isControlled = initialState !== undefined;
  const [user, setUser] = useState<AuthUser | null>(initialState?.user ?? null);
  const [loading, setLoading] = useState(initialState?.loading ?? true);

  const signInWithGoogle = useCallback(async () => {
    const { signInWithGoogle: signIn } = await loadAuthProviders();
    await signIn();
  }, []);

  const signInWithApple = useCallback(async () => {
    const { signInWithApple: signIn } = await loadAuthProviders();
    await signIn();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { signInWithEmail: signIn } = await loadAuthProviders();
    await signIn(email, password);
  }, []);

  const registerWithEmail = useCallback(
    async (email: string, password: string) => {
      const { registerWithEmail: register } = await loadAuthProviders();
      await register(email, password);
    },
    [],
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    const { sendPasswordReset: sendReset } = await loadAuthProviders();
    await sendReset(email);
  }, []);

  const signOut = useCallback(async () => {
    const { signOutUser } = await loadAuthProviders();
    await signOutUser();
    if (isControlled) {
      setUser(null);
    }
  }, [isControlled]);

  const getIdToken = useCallback(async (forceRefresh = false) => {
    const { getIdToken: readIdToken } = await loadAuthProviders();
    return readIdToken(forceRefresh);
  }, []);

  const authActions: AuthActions = useMemo(
    () => ({
      signInWithGoogle,
      signInWithApple,
      signInWithEmail,
      registerWithEmail,
      sendPasswordReset,
      signOut,
      getIdToken,
    }),
    [
      getIdToken,
      registerWithEmail,
      sendPasswordReset,
      signInWithApple,
      signInWithEmail,
      signInWithGoogle,
      signOut,
    ],
  );

  const authValue = useMemo(
    () => ({
      user,
      loading,
      ...authActions,
    }),
    [authActions, loading, user],
  );

  const authController = useMemo(
    () => ({
      isControlled,
      setAuthUser: setUser,
      setAuthLoading: setLoading,
    }),
    [isControlled],
  );

  return (
    <AuthControllerContext.Provider value={authController}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </AuthControllerContext.Provider>
  );
};
