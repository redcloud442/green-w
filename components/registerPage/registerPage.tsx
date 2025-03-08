"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { checkUserName, createTriggerUser } from "@/services/auth/auth";
import { BASE_URL } from "@/utils/constant";
import { escapeFormData } from "@/utils/function";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useController, useForm } from "react-hook-form";
import Turnstile, { BoundTurnstileObject } from "react-turnstile";
import { z } from "zod";
import NavigationLoader from "../ui/NavigationLoader";
import { PasswordInput } from "../ui/passwordInput";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

const RegisterSchema = z
  .object({
    firstName: z
      .string()
      .min(4, "First name is required")
      .max(50, "First name must be less than 50 characters"),
    lastName: z
      .string()
      .min(4, "Last name is required")
      .max(50, "Last name must be less than 50 characters"),
    userName: z
      .string()
      .min(6, "Username must be at least 6 characters long")
      .max(20, "Username must be at most 50 characters long")
      .regex(
        /^[a-zA-Z][a-zA-Z0-9._]*$/,
        "Username must start with a letter and can only contain letters, numbers, dots, and underscores"
      ),
    activeMobile: z
      .string()
      .optional()
      .refine(
        (val) => val === undefined || val === "" || /^0\d{10}$/.test(val),
        "Active Mobile must start with '0' and contain exactly 11 digits."
      ),
    activeEmail: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val?.trim() === "" ? null : val))
      .refine(
        (val) => val === null || z.string().email().safeParse(val).success,
        "Invalid email address"
      ),
    botField: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()

      .min(6, "Confirm Password must be at least 6 characters"),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "The passwords did not match",
        path: ["confirmPassword"],
      });
    }
  });

type RegisterFormData = z.infer<typeof RegisterSchema>;

type Props = {
  referralLink: string;
};
const RegisterPage = ({ referralLink }: Props) => {
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);
  const [isUsernameValidated, setIsUsernameValidated] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, touchedFields },
    control,
    setError,
    clearErrors,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
  });

  const lastNameSchema = z.string().min(4).max(50);
  const captcha = useRef<BoundTurnstileObject>(null);

  const router = useRouter();
  const { toast } = useToast();

  const [isSuccess, setIsSuccess] = useState(false);

  const url = `${BASE_URL}/register`;

  const { field: userNameField } = useController({
    name: "userName",
    control,
  });

  const validateUserName = async (value: string) => {
    if (!value) return null;

    setIsUsernameLoading(true);

    try {
      const result = await checkUserName({ userName: value });

      if (!result.ok) {
        setError("userName", { message: "Username is already taken" });
      } else {
        clearErrors("userName");
        setIsUsernameValidated(true);
      }
    } catch (e) {
      setError("userName", { message: "Fetching username failed. Try again." });
    } finally {
      setIsUsernameLoading(false);
    }
  };

  const handleRegistrationSubmit = async (data: RegisterFormData) => {
    if (isUsernameLoading || !isUsernameValidated) {
      return toast({
        title: "Please wait",
        description: "Please Check Your Username First Before Proceeding",
        variant: "destructive",
      });
    }

    if (!captchaToken) {
      if (captcha.current) {
        captcha.current.reset();
        captcha.current.execute();
      }

      return toast({
        title: "Please wait",
        description: "Refreshing CAPTCHA, please try again.",
        variant: "destructive",
      });
    }

    const sanitizedData = escapeFormData(data);
    const {
      userName,
      password,
      firstName,
      lastName,
      activeMobile,
      activeEmail,
      botField,
    } = sanitizedData;

    try {
      await createTriggerUser({
        activeMobile: activeMobile || "",
        userName: userName,
        password: password,
        firstName,
        lastName,
        referalLink: referralLink,
        url,
        activeEmail: activeEmail || "",
        botField: botField || "",
        captchaToken,
      });

      if (captcha.current) {
        captcha.current.reset();
      }

      setIsSuccess(true);

      toast({
        title: "Registration Success",
        description: "Please wait",
      });

      router.push("/");
    } catch (e) {
      setIsSuccess(false);
      if (e instanceof Error) {
        toast({
          title: "Error",
          description: e.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Check your account details and try again",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <ScrollArea className="h-[700px] rounded-md sm:h-auto w-full max-w-lg mx-auto">
      <Card className="w-full mx-auto ">
        <NavigationLoader visible={isSubmitting || isSuccess} />
        <CardTitle className="font-extrabold text-4xl text-center">
          Register
        </CardTitle>
        <Separator className="w-full my-2 bg-white" />
        <CardContent className="p-4">
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(handleRegistrationSubmit)}
          >
            {/* Username Field */}

            {/* First Name Field */}

            <input
              type="text"
              {...register("botField")}
              style={{ display: "none" }} // Hide from normal users
              tabIndex={-1} // Skip focus when tabbing
              autoComplete="off"
            />
            <div className="relative">
              <Label htmlFor="firstName">First Name</Label>
              <div className="flex items-center">
                <Input
                  id="firstName"
                  placeholder="First Name"
                  {...register("firstName")}
                  className="pr-10"
                />
                {touchedFields.firstName && !errors.firstName && (
                  <CheckIcon className="w-5 h-5 text-green-500 absolute right-3" />
                )}
              </div>
              {errors.firstName && (
                <p className="text-sm text-primaryRed">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name Field */}
            <div className="relative">
              <Label htmlFor="lastName">Last Name</Label>
              <div className="flex items-center">
                <Input
                  id="lastName"
                  placeholder="Last Name"
                  {...register("lastName")}
                  className="pr-10"
                />
                {touchedFields.lastName &&
                  !errors.lastName &&
                  lastNameSchema.safeParse(watch("lastName")).success && (
                    <CheckIcon className="w-5 h-5 text-green-500 absolute right-3" />
                  )}
              </div>
              {errors.lastName && (
                <p className="text-sm text-primaryRed">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div className="relative">
              <Label htmlFor="userName">Username</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="userName"
                  placeholder="Username"
                  className="pr-10"
                  {...register("userName")}
                />

                {!isUsernameLoading &&
                  isUsernameValidated &&
                  !errors.userName && (
                    <CheckIcon className="w-5 h-5 text-green-500 absolute right-24" />
                  )}

                {/* Show error icon if validation failed */}

                <Button
                  type="button"
                  disabled={isUsernameLoading}
                  onClick={() => validateUserName(userNameField.value)}
                  className=" bg-sky-500 border-white border-2 rounded-md text-gray-800 font-bold px-2 "
                >
                  Check
                </Button>
              </div>
              {errors.userName && (
                <p className="text-sm text-primaryRed">
                  {errors.userName.message}
                </p>
              )}
            </div>

            <div className="relative">
              <Label htmlFor="userName">Active Mobile Number (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="activeMobile"
                  maxLength={11}
                  placeholder="Active Mobile"
                  className="pr-10"
                  {...register("activeMobile")}
                />

                {/* Show error icon if validation failed */}
              </div>
              {errors.activeMobile && (
                <p className="text-sm text-primaryRed">
                  {errors.activeMobile.message}
                </p>
              )}
            </div>

            <div className="relative">
              <Label htmlFor="activeEmail">Active Email (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="activeEmail"
                  placeholder="Active Email"
                  className="pr-10"
                  {...register("activeEmail")}
                />
              </div>
              {errors.activeEmail && (
                <p className="text-sm text-primaryRed">
                  {errors.activeEmail.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="relative">
              <Label htmlFor="password">Password</Label>

              <PasswordInput
                id="password"
                placeholder="Password"
                {...register("password")}
                className="pr-10"
              />
              {touchedFields.password && !errors.password && (
                <CheckIcon className="w-5 h-5 text-green-500 absolute right-10 top-8" />
              )}

              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <Label htmlFor="confirmPassword">Repeat Password</Label>

              <PasswordInput
                id="confirmPassword"
                placeholder="Confirm Password"
                {...register("confirmPassword")}
                className="pr-10"
              />
              {touchedFields.confirmPassword &&
                !errors.confirmPassword &&
                touchedFields.password &&
                !errors.password &&
                watch("password") === watch("confirmPassword") && (
                  <CheckIcon className="w-5 h-5 text-green-500 absolute right-10 top-8 " />
                )}
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-primaryRed">
                {errors.confirmPassword.message}
              </p>
            )}

            <div className="relative">
              <Label htmlFor="confirmPassword">Sponsor</Label>
              <div className="flex text-black">
                <Input
                  id="sponsor"
                  readOnly
                  placeholder="Sponsor"
                  value={referralLink}
                  className="pr-10"
                />
              </div>
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

            <div className="w-full flex ">
              <Button
                variant="card"
                className="px-4  w-full font-extrabold text-lg rounded-md"
                disabled={isSubmitting || isSuccess}
                type="submit"
              >
                SIGN UP
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </ScrollArea>
  );
};

export default RegisterPage;
