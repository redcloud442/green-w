"use client";
import { alliance_member_table } from "@prisma/client";
import { Controller, useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import { cn } from "@/lib/utils";
import { getAdminWithdrawalReport } from "@/services/Withdrawal/Admin";
import { format } from "date-fns"; // If you're using date-fns
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import AdminWithdrawalReportTable from "./AdminWithdrawalReportTable";

type Props = {
  teamMemberProfile: alliance_member_table;
};

type FormData = {
  dateFilter: {
    startDate: Date | null;
    endDate: Date | null;
  };
};

const AdminWithdrawalReport = ({ teamMemberProfile }: Props) => {
  const [isFetchingList, setIsFetchingList] = useState(false);

  const { control, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      dateFilter: {
        startDate: null,
        endDate: null,
      },
    },
  });

  const dateFilter = watch("dateFilter");

  const onSubmit = async (data: FormData) => {
    const { startDate, endDate } = data.dateFilter;

    const {
      data: requestData,
      total_amount,
      total_count,
    } = await getAdminWithdrawalReport({
      startDate: String(startDate || ""),
      endDate: String(endDate || ""),
      take: 10,
      skip: 1,
    });

    console.log(requestData);
  };

  return (
    <div className="mx-auto md:p-10">
      <div>
        <header className="mb-4">
          <h1 className="Title">Withdrawal Report Page</h1>
        </header>

        {/* Table Section */}

        <section className="rounded-lg flex flex-col gap-4">
          <Card className="w-full rounded-sm ">
            <CardHeader>
              <CardTitle>Withdrawal Report</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex w-full items-end  gap-4">
                  {/* Date Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"card"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFilter.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon />
                        {dateFilter.startDate ? (
                          format(dateFilter.startDate, "PPP")
                        ) : (
                          <span>Start Date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Controller
                        control={control}
                        name="dateFilter.startDate"
                        render={({ field }) => (
                          <Calendar
                            mode="single"
                            selected={
                              dateFilter.startDate
                                ? dateFilter.startDate
                                : undefined
                            }
                            onSelect={(newDate) => {
                              field.onChange(newDate); // Update the form field value
                              setValue(
                                "dateFilter.startDate",
                                newDate ? newDate : null
                              ); // Manually set the value of the date field
                            }}
                            initialFocus
                          />
                        )}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"card"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFilter.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon />

                        {dateFilter.endDate ? (
                          format(dateFilter.endDate, "PPP")
                        ) : (
                          <span>End Date</span>
                        )}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                      <Controller
                        control={control}
                        name="dateFilter.endDate"
                        render={({ field }) => (
                          <Calendar
                            mode="single"
                            selected={
                              dateFilter.endDate
                                ? dateFilter.endDate
                                : undefined
                            }
                            onSelect={(newDate) => {
                              field.onChange(newDate); // Update the form field value
                              setValue(
                                "dateFilter.endDate",
                                newDate ? newDate : null
                              ); // Manually set the value of the date field
                            }}
                            initialFocus
                          />
                        )}
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    type="submit"
                    className="mt-4 btn btn-primary"
                    variant={"card"}
                  >
                    Submit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <AdminWithdrawalReportTable teamMemberProfile={teamMemberProfile} />
        </section>
      </div>
    </div>
  );
};

export default AdminWithdrawalReport;
