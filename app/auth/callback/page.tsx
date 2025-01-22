"use client";

import { Alert } from "@/components/ui/alert";
import { createClientSide } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AuthCallback = () => {
  const supabase = createClientSide();
  const router = useRouter();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const handleMagicLink = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const hashed_token = queryParams.get("hashed_token") as string;

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: hashed_token,
        type: "email",
      });

      if (error || !data?.session) {
        setStatus("error");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
        return;
      }

      setStatus("success");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    };

    handleMagicLink();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      {status === "loading" && (
        <div className="flex flex-col items-center">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="mt-2 text-lg font-medium">
            Processing your magic link...
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center">
          <p className="text-lg font-medium text-green-600">
            Success! Redirecting to the dashboard...
          </p>
        </div>
      )}

      {status === "error" && (
        <Alert className="w-full max-w-md p-4 text-red-600 bg-red-100 border border-red-300 rounded-md">
          Invalid or expired magic link. Redirecting to the login page...
        </Alert>
      )}
    </div>
  );
};

export default AuthCallback;
