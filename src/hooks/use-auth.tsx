import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getMe, loginUser } from "@/api/auth";
import { toast } from "sonner";

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  email_confirmed_at?: string;
  confirmed_at?: string;
  phone?: string;
}

export interface Session {
  access_token: string;
  user: User;
}

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshAuth: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userDto = await getMe(token);
      const mappedUser: User = {
        id: userDto.id,
        fullName: userDto.fullName,
        email: userDto.email,
        createdAt: userDto.createdAt,
        email_confirmed_at: userDto.createdAt,
        confirmed_at: userDto.createdAt,
      };
      setSession({ access_token: token, user: mappedUser });
      setUser(mappedUser);
    } catch (err) {
      console.error("Token verification failed, clearing session:", err);
      localStorage.removeItem("jwt_token");
      setSession(null);
      setUser(null);
      setLoading(false);
      throw err; // re-throw so callers (e.g. refreshAuth) can handle failure
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      const mappedUser: User = {
        id: response.user.id,
        fullName: response.user.fullName,
        email: response.user.email,
        createdAt: response.user.createdAt,
        email_confirmed_at: response.user.createdAt,
        confirmed_at: response.user.createdAt,
      };
      localStorage.setItem("jwt_token", response.token);
      setSession({ access_token: response.token, user: mappedUser });
      setUser(mappedUser);
    } catch (err: any) {
      console.error("Sign in failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem("jwt_token");
    setSession(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, session, loading, signIn, signOut, refreshAuth: initAuth }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
export type { AuthCtx };
