import {
  alliance_member_table,
  alliance_referral_link_table,
  package_table,
  user_table,
} from "@prisma/client";
import DashboardBody from "./DashboardBody";
import DashboardHeader from "./DashboardHeader";
import NewlyRegisteredModal from "./NewlyRegisteredModal/NewlyRegisteredModal";

type Props = {
  teamMemberProfile: alliance_member_table;
  referal: alliance_referral_link_table;
  packages: package_table[];
  profile: user_table;
  sponsor: string;
};

const DashboardPage = ({
  teamMemberProfile,
  packages,
  profile,
  referal,
}: Props) => {
  return (
    <div className="relative min-h-screen mx-auto space-y-4 mt-24 sm:px-0 sm:mb-20 overflow-x-hidden">
      <DashboardHeader
        profile={profile}
        teamMemberProfile={teamMemberProfile}
        referal={referal}
      />

      <NewlyRegisteredModal
        isActive={teamMemberProfile.alliance_member_is_active}
      />

      <DashboardBody
        teamMemberProfile={teamMemberProfile}
        packages={packages}
        profile={profile}
      />
    </div>
  );
};

export default DashboardPage;
