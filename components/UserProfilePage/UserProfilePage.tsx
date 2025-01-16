"use client";

import { UserRequestdata } from "@/utils/types";
import ChangePassword from "../UserAdminProfile/ChangePassword";
import PersonalInformation from "../UserAdminProfile/PersonalInformation";

type Props = {
  userProfile: UserRequestdata;
};

const UserProfilePage = ({ userProfile }: Props) => {
  return (
    <div className="mx-auto py-8 px-8">
      <div className="w-full flex flex-col gap-6">
        {/* Page Title */}
        <header>
          <h1 className="Title text-white">User Profile</h1>
          <p className="text-white ">
            View your personal information and change your password.
          </p>
        </header>

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
