"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { handleSignInAdmin } from "@/services/auth/auth";
import { escapeFormData, userNameToEmail } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRef, useState } from "react";
import { FieldErrors, SubmitHandler, useForm } from "react-hook-form";
import Turnstile, { BoundTurnstileObject } from "react-turnstile";
import { z } from "zod";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
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

// Zod Schema for OTP Form
export const OtpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

type LoginFormValues = z.infer<typeof LoginSchema>;
type OtpFormValues = z.infer<typeof OtpSchema>;

const LoginPageSecured = () => {
  const [step, setStep] = useState<"login" | "verify">("login");
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captcha = useRef<BoundTurnstileObject>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormValues | OtpFormValues>({
    resolver: zodResolver(step === "login" ? LoginSchema : OtpSchema),
  });

  const supabase = createClientSide();
  const { toast } = useToast();

  const handleSignIn = async (data: LoginFormValues) => {
    try {
      if (!captchaToken) {
        return toast({
          title: "Please wait",
          description: "Captcha is required.",
          variant: "destructive",
        });
      }
      setIsLoading(true);

      const sanitizedData = escapeFormData(data);

      const validation = LoginSchema.safeParse(sanitizedData);

      if (!validation.success) {
        toast({
          title: "Invalid input",
          variant: "destructive",
        });
        return;
      }

      const { userName, password } = sanitizedData;

      const result = await handleSignInAdmin({
        userName,
        password,
      });

      if (!result.ok) {
        toast({
          title: "Not Allowed",
          variant: "destructive",
        });
        return;
      }

      const userEmail = userNameToEmail(userName);

      setEmail(userEmail);

      const { error } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: {
          captchaToken,
        },
      });

      if (error) throw new Error("Invalid username or password");

      if (captcha.current) {
        captcha.current.reset();
      }

      toast({
        title: "OTP sent to your email",
        description: `Check your inbox for the OTP.`,
      });

      setStep("verify");
      reset();
    } catch (e) {
      if (e instanceof Error) {
        toast({
          title: "Invalid username or password",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (data: OtpFormValues) => {
    try {
      setIsLoading(true);

      if (!email) {
        throw new Error("Email is missing. Please try logging in again.");
      }

      const { otp } = data;

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw new Error("Invalid OTP");

      toast({
        title: "Successfully logged in!",
      });

      window.location.href = "/admin";
    } catch (e) {
      if (e instanceof Error) {
        toast({
          title: "Invalid OTP",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-start min-h-screen h-full p-2">
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
        {step === "login" ? (
          <form
            className="flex flex-col items-center gap-6"
            onSubmit={handleSubmit(
              handleSignIn as SubmitHandler<
                { userName: string } | { otp: string }
              >
            )}
          >
            <div className="w-full text-center">
              <Label htmlFor="username">Username</Label>
              <Input
                variant="non-card"
                id="username"
                {...register("userName")}
              />
              {(errors as FieldErrors<LoginFormValues>).userName && (
                <p className="text-sm text-primaryRed">
                  {(errors as FieldErrors<LoginFormValues>).userName?.message}
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
              {(errors as FieldErrors<LoginFormValues>).password && (
                <p className="text-sm text-primaryRed">
                  {(errors as FieldErrors<LoginFormValues>).password?.message}
                </p>
              )}
            </div>
            <div className="w-full flex flex-1 justify-center">
              <Turnstile
                size="flexible"
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ""}
                onVerify={(token) => {
                  setCaptchaToken(token);
                }}
              />
            </div>
            <Button
              variant="card"
              className="w-72 rounded-md"
              disabled={isSubmitting || isLoading}
              type="submit"
            >
              {isSubmitting || isLoading ? "Sending OTP..." : "Login"}
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col w-full items-center gap-6"
            onSubmit={handleSubmit(
              handleVerifyOtp as SubmitHandler<
                { userName: string } | { otp: string }
              >
            )}
          >
            <div className="w-full justify-center items-center flex flex-col gap-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <InputOTP
                maxLength={6}
                value={watch("otp")}
                onChange={(value) => setValue("otp", value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {(errors as FieldErrors<OtpFormValues>).otp && (
                <p className="text-sm text-primaryRed">
                  {(errors as FieldErrors<OtpFormValues>).otp?.message}
                </p>
              )}
            </div>
            <Button
              variant="card"
              className="w-72 rounded-md"
              disabled={isSubmitting || isLoading}
              type="submit"
            >
              {isSubmitting || isLoading ? "Verifying OTP..." : "Verify"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default LoginPageSecured;
