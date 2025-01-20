"use client";

import { createClientSide } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AuthCallback = () => {
  const supabase = createClientSide();
  const router = useRouter();

  useEffect(() => {
    const handleMagicLink = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const hashed_token = queryParams.get("hashed_token") as string;

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: hashed_token,
        type: "email",
      });

      if (error || !data.session) {
        return router.push("/login");
      }

      router.push("/");
    };

    handleMagicLink();
  }, []);

  return <div>Processing magic link...</div>;
};

export default AuthCallback;
