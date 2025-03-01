"use client";
import { alliance_member_table } from "@prisma/client";
import { Controller, useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import { logError } from "@/services/Error/ErrorLogs";
import { getAdminTopUpTotalReport } from "@/services/TopUp/Admin";
import { adminSalesTotalReportData } from "@/utils/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import AdminSalesReportTable from "./AdminSalesReportTable";
type Props = {
  teamMemberProfile: alliance_member_table;
};

const months = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, index) => ({
  label: (currentYear - index).toString(),
  value: (currentYear - index).toString(),
}));

type FormData = {
  dateFilter: {
    month: string;
    year: string;
  };
};

const AdminSalesReportPage = ({ teamMemberProfile }: Props) => {
  const supabaseClient = createClientComponentClient();
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [salesReportData, setSalesReportData] =
    useState<adminSalesTotalReportData>({
      monthlyTotal: 0,
      monthlyCount: 0,
      dailyIncome: [],
    });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { control, handleSubmit, getValues } = useForm<FormData>({
    defaultValues: {
      dateFilter: {
        month: `0${currentMonth.toString()}`,
        year: currentYear.toString(),
      },
    },
  });

  const handleFetchTotalWithdrawalReport = async () => {
    try {
      const { dateFilter } = getValues();

      setIsFetchingList(true);

      const data = await getAdminTopUpTotalReport({
        dateFilter: {
          month: dateFilter.month ?? "",
          year: dateFilter.year ?? "",
        },
      });

      setSalesReportData(data);
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/AdminWithdrawalReportTable",
        });
      }
    } finally {
      setIsFetchingList(false);
    }
  };

  useEffect(() => {
    handleFetchTotalWithdrawalReport();
  }, []);

  return (
    <div className="mx-auto md:p-10">
      <div>
        <header className="mb-4">
          <h1 className="Title">Sales Report Page</h1>
        </header>

        {/* Table Section */}

        <section className="rounded-lg flex flex-col gap-4">
          <Card className="w-full rounded-sm ">
            <CardHeader>
              <CardTitle>Sales Report</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleFetchTotalWithdrawalReport)}>
                <div className="flex flex-col sm:flex-row w-full items-end gap-4 flex-wrap">
                  {/* Month Selection */}
                  <Controller
                    control={control}
                    name="dateFilter.month"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full flex-1  text-left">
                          <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {/* Year Selection */}
                  <Controller
                    control={control}
                    name="dateFilter.year"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full flex-1 text-left">
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant={"card"}
                    className="w-full md:w-auto rounded-md"
                  >
                    Submit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <AdminSalesReportTable
            salesReportData={salesReportData}
            isFetchingList={isFetchingList}
          />
        </section>
      </div>
    </div>
  );
};

export default AdminSalesReportPage;
