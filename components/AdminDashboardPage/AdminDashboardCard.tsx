import { AdminDashboardDataByDate } from "@/utils/types";
import {
  CreditCard,
  Package,
  PhilippinePeso,
  UserCheck2Icon,
} from "lucide-react";
import CardAmountAdmin from "../ui/CardAmountAdmin";

type Props = {
  adminDashboardDataByDate: AdminDashboardDataByDate;
};

const AdminDashboardCard = ({ adminDashboardDataByDate }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <CardAmountAdmin
        title="Total Package"
        value={
          <>
            <PhilippinePeso />{" "}
            {Number(
              adminDashboardDataByDate?.packageEarnings ?? 0
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </>
        }
        description=""
        descriptionClassName="text-sm text-green-600"
      />
      <CardAmountAdmin
        title="Total Earnings"
        value={
          <>
            <PhilippinePeso />{" "}
            {Number(
              adminDashboardDataByDate?.totalEarnings ?? 0
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </>
        }
        description=""
        descriptionClassName="text-sm text-green-600"
      />
      <CardAmountAdmin
        title="Total Withdraw"
        value={
          <>
            <PhilippinePeso />{" "}
            {Number(
              adminDashboardDataByDate?.totalWithdraw ?? 0
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </>
        }
        description=""
        descriptionClassName="text-sm text-gray-500"
      />
      <CardAmountAdmin
        title="Direct Referral"
        value={
          <>
            <PhilippinePeso />{" "}
            {Number(adminDashboardDataByDate?.directLoot ?? 0).toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </>
        }
        description=""
        descriptionClassName="text-sm text-gray-500"
      />
      <CardAmountAdmin
        title="Indirect Referral"
        value={
          <>
            <PhilippinePeso />{" "}
            {Number(adminDashboardDataByDate?.indirectLoot ?? 0).toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </>
        }
        description=""
        descriptionClassName="text-sm text-gray-500"
      />
      <CardAmountAdmin
        title="Active Package"
        value={
          <>
            <Package />
            {adminDashboardDataByDate?.activePackageWithinTheDay}
          </>
        }
        description=""
        descriptionClassName="text-sm text-gray-500"
      />
      <CardAmountAdmin
        title="Active Users"
        value={
          <>
            <UserCheck2Icon />
            {adminDashboardDataByDate?.totalActivatedUserByDate}
          </>
        }
        description=""
        descriptionClassName="text-sm text-gray-500"
      />{" "}
      <CardAmountAdmin
        title="Approved Withdrawal"
        value={
          <>
            <CreditCard />
            {adminDashboardDataByDate?.totalApprovedWithdrawal ?? 0}
          </>
        }
        description=""
        descriptionClassName="text-sm text-gray-500"
      />
      <CardAmountAdmin
        title="Approved Receipts"
        value={
          <>
            <CreditCard />
            {adminDashboardDataByDate?.totalApprovedReceipts ?? 0}
          </>
        }
        description=""
        descriptionClassName="text-sm text-gray-500"
      />
      <CardAmountAdmin
        title="Sales Difference"
        value={
          <>
            <CreditCard />
            {(
              Number(adminDashboardDataByDate?.totalEarnings ?? 0) -
              Number(adminDashboardDataByDate?.totalWithdraw ?? 0)
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) ?? 0}
          </>
        }
        description=""
        descriptionClassName="text-sm text-gray-500"
      />
      <CardAmountAdmin
        title="User Reinvested"
        value={
          <>
            <CreditCard />
            {adminDashboardDataByDate?.reinvestorsCount ?? 0}
          </>
        }
        description=""
        descriptionClassName="text-sm text-gray-500"
      />
    </div>
  );
};

export default AdminDashboardCard;
