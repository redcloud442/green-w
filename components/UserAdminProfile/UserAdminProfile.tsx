import { UserRequestdata } from "@/utils/types";
import { user_table } from "@prisma/client";
import TopUpHistoryTable from "../TopUpHistoryPage/TopUpHistoryTable";
import WithdrawalHistoryTable from "../WithrawalHistoryPage/WithdrawalHistoryTable";
import ChangePassword from "./ChangePassword";
import MerchantBalance from "./MerchantBalance";
import PersonalInformation from "./PersonalInformation";

type Props = {
  userProfile: UserRequestdata;
  profile: user_table;
};

const UserAdminProfile = ({ userProfile: initialData, profile }: Props) => {
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

        <PersonalInformation userProfile={initialData} />
        {initialData.alliance_member_role === "MERCHANT" && (
          <MerchantBalance profile={profile} userProfile={initialData} />
        )}

        <ChangePassword userProfile={initialData} />

        <TopUpHistoryTable teamMemberProfile={initialData} />

        <WithdrawalHistoryTable teamMemberProfile={initialData} />
      </div>
    </div>
  );
};

export default UserAdminProfile;
