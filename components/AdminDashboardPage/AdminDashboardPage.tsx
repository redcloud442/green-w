"use client";

import { useToast } from "@/hooks/use-toast";
import { getTotalReferral } from "@/services/Bounty/Admin";
import {
  getAdminDashboard,
  getAdminDashboardByDate,
} from "@/services/Dasboard/Admin";
import { logError } from "@/services/Error/ErrorLogs";
import { createClientSide } from "@/utils/supabase/client";
import { AdminDashboardData, AdminDashboardDataByDate } from "@/utils/types";
import {
  alliance_member_table,
  alliance_referral_link_table,
  package_notification_logs,
} from "@prisma/client";
import { format } from "date-fns";
import {
  CalendarIcon,
  Package2Icon,
  PersonStandingIcon,
  PhilippinePeso,
  User2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import CardAmountAdmin from "../ui/CardAmountAdmin";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import TableLoading from "../ui/tableLoading";
import AdminDashboardCard from "./AdminDashboardCard";
import AdminDashboardChart from "./AdminDashboardChart";
type Props = {
  teamMemberProfile: alliance_member_table;
  referral: alliance_referral_link_table;
  packageNotification: package_notification_logs[];
};

type FormContextType = {
  dateFilter: {
    start: string;
    end: string;
  };
};

const AdminDashboardPage = ({
  teamMemberProfile,
  referral,
  packageNotification,
}: Props) => {
  const supabaseClient = createClientSide();
  const router = useRouter();
  const { toast } = useToast();
  const [adminDashboardByDate, setAdminDashboardByDate] =
    useState<AdminDashboardDataByDate>();
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardData>();
  const [isLoading, setIsLoading] = useState(false);
  const [totalReferral, setTotalReferral] = useState(0);
  const filterMethods = useForm<FormContextType>({
    defaultValues: {
      dateFilter: {
        start: undefined,
        end: undefined,
      },
    },
  });

  const { getValues, control, handleSubmit, watch } = filterMethods;

  const formatDateToLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchAdminDashboardData = async () => {
    try {
      if (!teamMemberProfile) return;
      setIsLoading(true);
      const { dateFilter } = getValues();

      const startDate = dateFilter.start
        ? new Date(dateFilter.start)
        : undefined;
      const formattedStartDate = startDate ? formatDateToLocal(startDate) : "";

      const endDate = dateFilter.end ? new Date(dateFilter.end) : undefined;
      const formattedEndDate = endDate
        ? formatDateToLocal(new Date(endDate.setHours(23, 59, 59, 999)))
        : "";

      const data = await getAdminDashboardByDate(supabaseClient, {
        teamMemberId: teamMemberProfile.alliance_member_id,
        dateFilter: {
          start: formattedStartDate,
          end: formattedEndDate,
        },
      });

      setAdminDashboardByDate(data);

      const totalReferral = await getTotalReferral(supabaseClient, {
        teamMemberId: teamMemberProfile.alliance_member_id,
      });

      setTotalReferral(totalReferral);
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/AdminDashboardPage/AdminDashboardPage.tsx",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboardData();
  }, [teamMemberProfile]);

  useEffect(() => {
    const fetchAdminDashboardData = async () => {
      if (!teamMemberProfile) return;
      const data = await getAdminDashboard(supabaseClient, {
        teamMemberId: teamMemberProfile.alliance_member_id,
      });

      setAdminDashboard(data);
    };
    fetchAdminDashboardData();
  }, [teamMemberProfile]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referral.alliance_referral_link);
      toast({
        title: "Link copied!",
        description: "Link copied to clipboard",
        variant: "success",
      });
    } catch (err) {}
  };
  const startDate = watch("dateFilter.start");
  const endDate = watch("dateFilter.end");

  return (
    <div className="mx-auto md:p-10 space-y-6">
      {isLoading && <TableLoading />}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <h1 className="Title">Admin Dashboard</h1>

        <form
          onSubmit={handleSubmit(fetchAdminDashboardData)}
          className="flex flex-wrap items-center gap-4"
        >
          <Controller
            name="dateFilter.start"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-normal w-full md:w-auto justify-start"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value
                      ? format(new Date(field.value), "PPP")
                      : "Select Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full md:w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date: Date | undefined) =>
                      field.onChange(date?.toISOString() || "")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          <Controller
            name="dateFilter.end"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-normal w-full md:w-auto justify-start"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value
                      ? format(new Date(field.value), "PPP")
                      : "Select End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full md:w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date: Date | undefined) =>
                      field.onChange(date?.toISOString() || "")
                    }
                    fromDate={startDate ? new Date(startDate) : undefined}
                    disabled={(date) =>
                      startDate ? date < new Date(startDate) : false
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          <Button
            variant="card"
            className="w-full md:w-auto rounded-md"
            disabled={!startDate || !endDate}
            type="submit"
          >
            Submit
          </Button>
        </form>
      </div>
      {/* <AdminUserNotifyModal packageNotification={packageNotification} /> */}
      <div className="flex flex-col gap-6">
        <div>
          <AdminDashboardCard
            adminDashboardDataByDate={adminDashboardByDate!}
          />
        </div>
        <div>
          <AdminDashboardChart
            chartData={adminDashboardByDate?.chartData ?? []}
          />
        </div>

        <Card className="w-full md:min-w-md">
          <CardHeader>
            <CardTitle> Total Referral</CardTitle>
            <CardDescription className="flex gap-x-2 text-xl font-bold">
              <PhilippinePeso />
              {totalReferral.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap w-full  items-center gap-4">
              <Input
                type="text"
                value={referral.alliance_referral_link}
                readOnly
                className="flex-0 md:flex-2 lg:flex-1"
              />
              <Button
                variant="card"
                className="w-full md:w-auto rounded-md"
                onClick={handleCopyLink}
              >
                Copy Link
              </Button>
              <Button
                variant="card"
                className="w-full md:w-auto rounded-md"
                onClick={() => router.push("/referral")}
              >
                Referral
              </Button>
              <Button
                variant="card"
                className="w-full md:w-auto rounded-md"
                onClick={() => router.push("/network")}
              >
                Network
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardAmountAdmin
            title="Total Registered User"
            value={
              <>
                <User2 />
                {adminDashboard?.numberOfRegisteredUser}
              </>
            }
            description=""
            descriptionClassName="text-sm text-gray-500"
          />

          <CardAmountAdmin
            title="Total Activated Package"
            value={
              <>
                <Package2Icon />
                {adminDashboard?.totalActivatedPackage}
              </>
            }
            description=""
            descriptionClassName="text-sm text-gray-500"
          />
          <CardAmountAdmin
            title="Total Activated User"
            value={
              <>
                <PersonStandingIcon />
                {adminDashboard?.totalActivatedUser}
              </>
            }
            description=""
            descriptionClassName="text-sm text-gray-500"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
