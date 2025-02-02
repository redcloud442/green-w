"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { loginValidation } from "@/services/auth/auth";
import { escapeFormData } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import NavigationLoader from "../ui/NavigationLoader";
import { PasswordInput } from "../ui/passwordInput";

// Zod Schema for Login Form
export const LoginSchema = z.object({
  userName: z
    .string()
    .min(6, "Username must be at least 6 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
  });

  const router = useRouter();
  const supabase = createClientSide();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSignIn = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const sanitizedData = escapeFormData(data);

      const { userName, password } = sanitizedData;

      await loginValidation(supabase, {
        userName,
        password,
      });

      toast({
        title: "Logging in to Elevate",
      });

      setIsSuccess(true);
      router.push("/");
    } catch (e) {
      if (e instanceof Error) {
        toast({
          title: e.message,
          variant: "destructive",
        });
      }

      setIsLoading(false); // Stop loader on error
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-start  min-h-screen h-full  p-2">
      <NavigationLoader visible={isSubmitting || isLoading || isSuccess} />

      <div className="">
        <Image
          src="/app-logo.png"
          alt="logo"
          width={400}
          height={250}
          priority
        />
      </div>
      <Card className="w-full max-w-lg z-40 relative p-6">
        <form
          className="flex flex-col items-center gap-6 "
          onSubmit={handleSubmit(handleSignIn)}
        >
          <div className="w-full text-center">
            <Label htmlFor="username">Username</Label>
            <Input variant="non-card" id="username" {...register("userName")} />
            {errors.userName && (
              <p className="text-sm text-primaryRed">
                {errors.userName.message}
              </p>
            )}
          </div>
          <div className="w-full text-center">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              variant="non-card"
              id="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-primaryRed">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            variant="card"
            className="w-72 rounded-md"
            disabled={isSubmitting || isLoading}
            type="submit"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit(handleSignIn);
              }
            }}
          >
            {isSubmitting || isLoading ? "Signing in..." : "Login"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
