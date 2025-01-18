"use client";

import { useRole } from "@/utils/context/roleContext";
import { UserRequestdata } from "@/utils/types";
import { useRouter } from "next/navigation";
import ChangePassword from "../UserAdminProfile/ChangePassword";
import PersonalInformation from "../UserAdminProfile/PersonalInformation";
import { Button } from "../ui/button";

type Props = {
  userProfile: UserRequestdata;
};

const UserProfilePage = ({ userProfile }: Props) => {
  const { role } = useRole();
  const router = useRouter();
  return (
    <div className="mx-auto py-8 px-2">
      <div className="w-full flex flex-col gap-6">
        {/* Page Title */}
        <header>
          <h1 className="Title text-white">User Profile</h1>
          <p className="text-white ">
            View your personal information and change your password.
          </p>
        </header>
        <div className="flex items-center justify-start gap-x-4">
          {role === "ACCOUNTING" && (
            <Button
              onClick={() => router.push("/withdraw")}
              variant="card"
              className="rounded-md"
            >
              Accounting
            </Button>
          )}
          {role === "MERCHANT" && (
            <>
              <Button
                onClick={() => router.push("/merchant")}
                variant="card"
                className="rounded-md"
              >
                Merchant
              </Button>
              <Button
                onClick={() => router.push("/deposit")}
                variant="card"
                className="rounded-md"
              >
                Deposit
              </Button>
            </>
          )}
        </div>

        <PersonalInformation
          type={
            userProfile.alliance_member_role as
              | "ADMIN"
              | "MEMBER"
              | "ACCOUNTING"
              | "MERCHANT"
          }
          userProfile={userProfile}
        />

        <ChangePassword userProfile={userProfile} />
      </div>
    </div>
  );
};

export default UserProfilePage;
