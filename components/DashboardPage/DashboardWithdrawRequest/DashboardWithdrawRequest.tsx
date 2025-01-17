import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  alliance_earnings_table,
  alliance_member_table,
  user_table,
} from "@prisma/client";
import { Dispatch, SetStateAction } from "react";
import DashboardWithdrawModalHistory from "./DashboardWithdrawModal/DashboardWithdrawModalHistory";
import DashboardWithdrawModalWithdraw from "./DashboardWithdrawModal/DashboardWithdrawModalWithdraw";
type Props = {
  teamMemberProfile: alliance_member_table;
  earnings: alliance_earnings_table;
  setEarnings: Dispatch<SetStateAction<alliance_earnings_table | null>>;
  profile: user_table;
};
const DashboardWithdrawRequest = ({
  teamMemberProfile,
  earnings,
  setEarnings,
  profile,
}: Props) => {
  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Withdrawal Request</CardTitle>
        <CardDescription>Completion status for packages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between gap-4">
          <h1 className="text-xl font-bold">Withdraw Request</h1>
          <div className="flex flex-col w-full max-w-lg gap-2">
            <DashboardWithdrawModalWithdraw
              profile={profile}
              teamMemberProfile={teamMemberProfile}
              earnings={earnings}
              setEarnings={setEarnings}
            />
            <DashboardWithdrawModalHistory
              teamMemberProfile={teamMemberProfile}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardWithdrawRequest;
