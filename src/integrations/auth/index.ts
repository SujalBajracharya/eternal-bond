import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const authService = {
  signInWithOAuth: async (
    provider: "google" | "apple" | "microsoft",
    opts?: SignInOptions
  ) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: opts?.redirect_uri || window.location.origin,
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        return { error, redirected: false };
      }

      if (data?.url) {
        // If Supabase returns a redirect URL (standard behavior on web),
        // we redirect the browser to it.
        window.location.href = data.url;
        return { redirected: true, error: null };
      }

      return { redirected: false, error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error(String(err)),
        redirected: false,
      };
    }
  },
};
