"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { checkUserName, createTriggerUser } from "@/services/auth/auth";
import { logError } from "@/services/Error/ErrorLogs";
import { BASE_URL } from "@/utils/constant";
import { escapeFormData } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { z } from "zod";
import NavigationLoader from "../ui/NavigationLoader";
import { PasswordInput } from "../ui/passwordInput";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import Text from "../ui/text";

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
      .max(20, "Username must be at most 20 characters long")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    activeMobile: z
      .string()
      .regex(
        /^0\d{10}$/,
        "Active Mobile must start with '0' and contain exactly 11 digits."
      ),

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
  const activeMobileSchema = z.number().min(10);

  const supabase = createClientSide();
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
      if (result.error) {
        setError("userName", { message: result.error });
      } else {
        clearErrors("userName");
        setIsUsernameValidated(true);
      }
    } catch (e) {
      setError("userName", { message: "Validation failed. Try again." });
    } finally {
      setIsUsernameLoading(false);
    }
  };

  const handleRegistrationSubmit = async (data: RegisterFormData) => {
    if (isUsernameLoading || !isUsernameValidated) {
      return toast({
        title: "Please wait",
        description: "Username validation is still in progress.",
        variant: "destructive",
      });
    }
    const sanitizedData = escapeFormData(data);

    const { userName, password, firstName, lastName, activeMobile } =
      sanitizedData;

    try {
      await createTriggerUser({
        activeMobile: activeMobile,
        userName: userName,
        password: password,
        firstName,
        lastName,
        referalLink: referralLink,
        url,
      });
      setIsSuccess(true);

      toast({
        title: "Registration Successful",
      });
      router.push("/");
    } catch (e) {
      setIsSuccess(false);
      if (e instanceof Error) {
        await logError(supabase, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/registerPage/registerPage.tsx",
        });
      }
      toast({
        title: "Error",
        description: "Check your account details and try again",
        variant: "destructive",
      });
    }
  };

  return (
    <ScrollArea className="h-[670px] rounded-md sm:h-auto w-full max-w-lg mx-auto">
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
              <Label htmlFor="userName">Active Mobile Number</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="activeMobile"
                  maxLength={11}
                  placeholder="Active Mobile"
                  className="pr-10"
                  {...register("activeMobile")}
                />

                {touchedFields.activeMobile &&
                  !errors.activeMobile &&
                  activeMobileSchema.safeParse(watch("activeMobile"))
                    .success && (
                    <CheckIcon className="w-5 h-5 text-green-500 absolute right-3" />
                  )}

                {/* Show error icon if validation failed */}
              </div>
              {errors.activeMobile && (
                <p className="text-sm text-primaryRed">
                  {errors.activeMobile.message}
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
        <CardFooter>
          <Text>
            Already have Elevate account?{" "}
            <Link href="/login" className="text-blue-500">
              Login
            </Link>
          </Text>
        </CardFooter>
      </Card>
    </ScrollArea>
  );
};

export default RegisterPage;
