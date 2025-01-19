import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartDataMember } from "@/utils/types";
import {
  alliance_earnings_table,
  alliance_member_table,
  package_table,
} from "@prisma/client";
import { Dispatch, SetStateAction } from "react";

import DashboardDepositModalHistory from "./DashboardDepositModal/DashboardDepositHistory";
import DashboardDepositModalDeposit from "./DashboardDepositModal/DashboardDepositModalDeposit";

type Props = {
  teamMemberProfile: alliance_member_table;
  packages: package_table[];
  earnings: alliance_earnings_table;
  setEarnings: Dispatch<SetStateAction<alliance_earnings_table | null>>;
  setChartData: Dispatch<SetStateAction<ChartDataMember[]>>;
  setIsActive: Dispatch<SetStateAction<boolean>>;
};

const DashboardDepositRequest = ({
  packages,
  setChartData,
  teamMemberProfile,
  earnings,
  setEarnings,
  setIsActive,
}: Props) => {
  // const [runTour, setRunTour] = useState(false); // Manage tour state

  // const steps = [
  //   {
  //     target: ".deposit-button", // Add this class to the Deposit Now button
  //     content: "Click here to start your deposit request.",
  //   },
  //   {
  //     target: ".package-selection", // Add this class to the package selection modal button
  //     content: "Select from the available packages to invest in your future.",
  //   },
  // ];

  // const handleJoyrideCallback = (data: { status: string }) => {
  //   const { status } = data;
  //   if (["finished", "skipped"].includes(status)) {
  //     setRunTour(false);
  //   }
  // };

  // useEffect(() => {
  //   if (teamMemberProfile.alliance_member_is_active) {
  //     setTimeout(
  //       () => setRunTour(!teamMemberProfile.alliance_member_is_active),
  //       1000
  //     );
  //   }
  // }, [teamMemberProfile]);

  return (
    <>
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>Deposit Request</CardTitle>
          <CardDescription>Inveest in your future with us </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-4">
            <h1 className="text-xl font-bold">Deposit Now</h1>
            <div className="flex flex-col w-full  gap-2">
              <DashboardDepositModalDeposit
                teamMemberProfile={teamMemberProfile}
                className="deposit-button"
              />

              <DashboardDepositModalHistory
                teamMemberProfile={teamMemberProfile}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* <ReactJoyride
        steps={steps}
        run={runTour}
        continuous
        callback={handleJoyrideCallback}
        styles={{
          options: {
            zIndex: 10000,
          },
        }}
      /> */}
    </>
  );
};

export default DashboardDepositRequest;
