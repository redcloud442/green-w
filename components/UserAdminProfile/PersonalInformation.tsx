import { handleSignInUser } from "@/app/actions/auth/authAction";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/services/Error/ErrorLogs";
import { getUserSponsor } from "@/services/User/User";
import { MAX_FILE_SIZE_MB, ROLE } from "@/utils/constant";
import { userNameToEmail } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { UserRequestdata } from "@/utils/types";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const data = await handleSignInUser({
        formattedUserName: userNameToEmail(userProfile.user_username ?? ""),
      });

      navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?hashed_token=${data.url.hashed_token}`
      );

      toast({
        title: "Copied to clipboard",
        description: `You may now access the user's account by accessing the link.`,
      });

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

  useEffect(() => {
    if (!userProfile.user_id) return;
    const fetchUserSponsor = async () => {
      try {
        const userSponsor = await getUserSponsor({
          userId: userProfile.user_id,
        });

        setUserSponsor(userSponsor);
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
    const result = schema.safeParse({ file });
    if (!result.success) {
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

      const { data: publicUrlData } = supabaseClient.storage
        .from("USER_PROFILE")
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error(
          "Failed to retrieve the public URL of the uploaded file."
        );
      }

      // Update user profile with new avatar URL
      const { error: updateError } = await supabaseClient
        .schema("user_schema")
        .from("user_table")
        .update({ user_profile_picture: publicUrlData.publicUrl })
        .eq("user_id", userProfile.user_id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      setAvatarUrl(publicUrlData.publicUrl);

      toast({
        title: "Profile Picture Updated Successfully",
      });
    } catch (error) {
      await supabaseClient.storage.from("USER_PROFILE").remove([filePath]);
      if (error instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: error.message,
          stackTrace: error.stack,
          stackPath: "components/UserAdminProfile/PersonalInformation.tsx",
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
            {userSponsor === null ? (
              <Loader2 className="animate-spin text-primary" />
            ) : (
              <span className="text-md ">
                (Sponsored by: {userSponsor.user_username})
              </span>
            )}
          </CardTitle>

          {/* Admin Button */}
          {type === ROLE.ADMIN && (
            <Button
              variant="card"
              className="lg:ml-auto"
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

      <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 p-6">
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
        <div>
          <Label className="text-sm font-medium ">Active Mobile Number</Label>
          <Input
            id="activeMobile"
            type="text"
            value={userProfile.user_active_mobile || ""}
            readOnly
            className="mt-1 border-gray-300"
          />
        </div>
        <div>
          <Label className="text-sm font-medium ">Email</Label>
          <Input
            id="email"
            type="text"
            value={userProfile.user_email || ""}
            readOnly
            className="mt-1 border-gray-300"
          />
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
    </Card>
  );
};

export default PersonalInformation;
