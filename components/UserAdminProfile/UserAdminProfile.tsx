"use client";

import { UserRequestdata } from "@/utils/types";
import { useState } from "react";
import TopUpHistoryTable from "../TopUpHistoryPage/TopUpHistoryTable";
import WithdrawalHistoryTable from "../WithrawalHistoryPage/WithdrawalHistoryTable";
import ChangePassword from "./ChangePassword";
import MerchantBalance from "./MerchantBalance";
import PersonalInformation from "./PersonalInformation";

type Props = {
  userProfile: UserRequestdata;
};

const UserAdminProfile = ({ userProfile: initialData }: Props) => {
  const [userProfileData, setUserProfileData] =
    useState<UserRequestdata>(initialData);
  return (
    <div className="mx-auto p-6 ">
      <div className="w-full flex flex-col gap-6">
        {/* Page Title */}
        <header>
          <h1 className="Title">User Profile</h1>
          <p className="text-gray-600 dark:text-white">
            View all the withdrawal history that are currently in the system.
          </p>
        </header>

        <PersonalInformation userProfile={userProfileData} />
        {userProfileData.alliance_member_role === "MERCHANT" && (
          <MerchantBalance userProfile={userProfileData} />
        )}

        <ChangePassword userProfile={userProfileData} />

        <TopUpHistoryTable teamMemberProfile={userProfileData} />

        <WithdrawalHistoryTable teamMemberProfile={userProfileData} />
      </div>
    </div>
  );
};

export default UserAdminProfile;
