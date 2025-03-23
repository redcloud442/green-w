"use client";

import { useToast } from "@/hooks/use-toast";
import { logError } from "@/services/Error/ErrorLogs";
import {
  getUserSponsor,
  handleGenerateLink,
  handleUpdateUserField,
  updateUserProfile,
} from "@/services/User/User";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, ROLE } from "@/utils/constant";
import { userNameToEmail } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { UserRequestdata } from "@/utils/types";
import { PencilIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import TableLoading from "../ui/tableLoading";

type Props = {
  userProfile: UserRequestdata;
  type?: "ADMIN" | "MEMBER" | "ACCOUNTING" | "MERCHANT";
};

const schema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => !!file, {
      message: "Please upload a file for validation.",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/jpg"].includes(file.type) &&
        file.size <= 12 * 1024 * 1024, // 12MB limit
      { message: "The file must be a JPEG or PNG image and less than 12MB." }
    ),
});

const changeEmailMobileSchema = z.object({
  activeMobile: z.string().min(11),
  activeEmail: z.string().email(),
});

type ChangeEmailMobileSchema = z.infer<typeof changeEmailMobileSchema>;

export type PersonalInformationSchema = z.infer<typeof schema>;
const PersonalInformation = ({ userProfile, type = "ADMIN" }: Props) => {
  const supabaseClient = createClientSide();

  const [isLoading, setIsLoading] = useState(false);
  const [userSponsor, setUserSponsor] = useState<{
    user_username: string;
  } | null>(null);

  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(
    userProfile.user_profile_picture || ""
  );
  const [isUploading, setIsUploading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const data = await handleGenerateLink({
        formattedUserName: userNameToEmail(userProfile.user_username ?? ""),
      });

      if (data.url.hashed_token) {
        await navigator.clipboard.writeText(
          `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?hashed_token=${data.url.hashed_token}`
        );
        setTimeout(() => {
          toast({
            title: "Copied to clipboard",
            description: `You may now access the user's account by accessing the link.`,
          });
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: "Something went wrong",
          variant: "destructive",
        });
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/UserAdminProfile/PersonalInformation.tsx",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ChangeEmailMobileSchema>({
    defaultValues: {
      activeMobile: userProfile.user_active_mobile || "",
      activeEmail: userProfile.user_email || "",
    },
  });

  const handleEditClick = (field: "activeMobile" | "activeEmail") => {
    setEditingField(field);
  };

  const handleSaveClick = async () => {
    try {
      setIsLoading(true);
      await handleUpdateUserField({
        userId: userProfile.user_id,
        type: editingField ?? "",
        value: getValues(editingField as "activeMobile" | "activeEmail"),
      });

      toast({
        title: "Profile updated successfully",
      });
      setEditingField(null);
      setIsLoading(false);
    } catch (e) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userProfile.user_id) return;
    const fetchUserSponsor = async () => {
      try {
        const userSponsor = await getUserSponsor({
          userId: userProfile.user_id,
        });

        setUserSponsor({ user_username: userSponsor });
      } catch (e) {
        if (e instanceof Error) {
          await logError(supabaseClient, {
            errorMessage: e.message,
            stackTrace: e.stack,
            stackPath: "components/UserAdminProfile/PersonalInformation.tsx",
          });
        }
      }
    };
    fetchUserSponsor();
  }, [userProfile.user_id]);

  const handleUploadProfilePicture = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "Error",
        description: `File size exceeds the ${MAX_FILE_SIZE_MB} MB limit.`,
        variant: "destructive",
      });
      return;
    }
    const filePath = `profile-pictures/${Date.now()}_${file.name}`;
    try {
      setIsUploading(true);
      const { error: uploadError } = await supabaseClient.storage
        .from("USER_PROFILE")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      const publicUrl = `https://content.elevateglobal.app/storage/v1/object/public/USER_PROFILE/${filePath}`;

      await updateUserProfile({
        userId: userProfile.user_id,
        profilePicture: publicUrl,
      });

      setAvatarUrl(publicUrl);

      toast({
        title: "Profile Picture Updated Successfully",
      });
    } catch (error) {
      await supabaseClient.storage.from("USER_PROFILE").remove([filePath]);
      if (error instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: error.message,
          stackTrace: error.stack,
          stackPath:
            "components/DashboardPage/DashboardDepositRequest/DashboardDepositModal/DashboardDepositProfile.tsx",
        });
      }
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isUploading) return <TableLoading />;

  return (
    <Card className="shadow-md">
      {isLoading && <TableLoading />}
      <CardHeader className="border-b pb-6 relative">
        <div className="flex flex-col lg:flex-row flex-wrap items-start lg:items-center justify-between gap-4">
          {/* Title Section */}
          <CardTitle className="text-lg font-semibold flex flex-wrap items-center gap-2">
            Personal Information
          </CardTitle>

          {/* Admin Button */}
          {type === ROLE.ADMIN && (
            <Button
              variant="card"
              className="lg:ml-auto rounded-md"
              onClick={async () => {
                await handleSignIn();
              }}
            >
              Sign In as {userProfile.user_username}
            </Button>
          )}
        </div>

        {/* Avatar Section */}
        <div className="relative flex justify-center lg:justify-end items-center mt-4">
          <Avatar
            onClick={() => inputRef.current?.click()}
            className="w-32 h-32 z-50 cursor-pointer"
          >
            <AvatarImage
              src={avatarUrl || ""}
              alt={`${userProfile.user_first_name} ${userProfile.user_last_name}`}
            />
            <AvatarFallback className="text-white bg-cardColor border-2 border-zinc-400 rounded-full mb-4 cursor-pointer">
              {userProfile.user_first_name?.slice(0, 1).toUpperCase()}
              {userProfile.user_last_name?.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Upload Input for Members */}
        {type === ROLE.MEMBER && (
          <Input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await handleUploadProfilePicture(file);
              }
            }}
          />
        )}
      </CardHeader>

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(handleSaveClick)}
      >
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 p-6">
          <div>
            <Label className="text-sm font-medium ">Sponsor</Label>
            <Input
              id="sponsor"
              type="text"
              value={userSponsor?.user_username || ""}
              readOnly
              className="mt-1 border-gray-300"
            />
          </div>
          <div>
            <Label className="text-sm font-medium ">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={userProfile.user_first_name || ""}
              readOnly
              className="mt-1 border-gray-300"
            />
          </div>
          <div>
            <Label className="text-sm font-medium ">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              value={userProfile.user_last_name || ""}
              readOnly
              className="mt-1 border-gray-300"
            />
          </div>
          <div>
            <Label className="text-sm font-medium ">Username</Label>
            <Input
              id="userName"
              type="text"
              value={userProfile.user_username || ""}
              readOnly
              className="mt-1 border-gray-300"
            />
          </div>

          <div className="relative">
            <Label className="text-sm font-medium">Active Mobile Number</Label>
            <div className="flex items-center gap-2">
              <Input
                id="activeMobile"
                type="text"
                maxLength={11}
                readOnly={editingField !== "activeMobile"}
                {...register("activeMobile")}
                className={`mt-1 border-gray-300 ${
                  editingField === "activeMobile" ? "border-blue-500" : ""
                }`}
              />
              {editingField !== "activeMobile" ? (
                <PencilIcon
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => handleEditClick("activeMobile")}
                />
              ) : (
                <Button
                  variant="card"
                  size="sm"
                  className="cursor-pointer"
                  onClick={handleSaveClick}
                >
                  Save
                </Button>
              )}
            </div>
          </div>

          {/* Editable Email */}
          <div className="relative">
            <Label className="text-sm font-medium">Email</Label>
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="text"
                readOnly={editingField !== "activeEmail"}
                {...register("activeEmail")}
                className={`mt-1 border-gray-300 ${
                  editingField === "activeEmail" ? "border-blue-500" : ""
                }`}
              />
              {editingField !== "activeEmail" ? (
                <PencilIcon
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => handleEditClick("activeEmail")}
                />
              ) : (
                <Button
                  variant="card"
                  size="sm"
                  className="cursor-pointer"
                  onClick={handleSaveClick}
                >
                  Save
                </Button>
              )}
            </div>
          </div>

          {type === ROLE.ADMIN && (
            <div>
              <Label className="text-sm font-medium ">Role</Label>
              <Input
                id="role"
                type="text"
                value={userProfile.alliance_member_role || "N/A"}
                readOnly
                className="mt-1 border-gray-300"
              />
            </div>
          )}
        </CardContent>
      </form>
    </Card>
  );
};

export default PersonalInformation;
