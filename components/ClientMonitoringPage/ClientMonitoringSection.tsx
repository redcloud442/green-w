"use client";

import { useClientDashboard } from "@/query/client/clientQuery";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { ChartConfig } from "../ui/chart";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import TableLoading from "../ui/tableLoading";
import { ClientMonitoringChart } from "./ClientMonitoringChart";

type FormContextType = {
  dateFilter: {
    start: string;
    end: string;
  };
};

const chartConfig = {
  dailyearnings: { label: "Daily Earnings", color: "hsl(var(--chart-1))" },
  dailywithdraw: { label: "Daily Withdraw", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const ClientMonitoringSection = () => {
  const { control, handleSubmit, watch } = useForm<FormContextType>({
    defaultValues: {
      dateFilter: {
        start: undefined,
        end: undefined,
      },
    },
  });

  const [queryParams, setQueryParams] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: "",
    endDate: "",
  });

  const startDate = watch("dateFilter.start");
  const endDate = watch("dateFilter.end");

  const handleClientMonitoring = (data: FormContextType) => {
    if (data.dateFilter.start && data.dateFilter.end) {
      setQueryParams({
        startDate: data.dateFilter.start,
        endDate: data.dateFilter.end,
      });
    }
  };

  const { data: chartData, isLoading } = useClientDashboard(queryParams);

  return (
    <div className="space-y-4">
      {isLoading && <TableLoading />}
      <form
        onSubmit={handleSubmit(handleClientMonitoring)}
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
                  className="font-normal w-full justify-start rounded-md"
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
                  className="font-normal w-full  justify-start rounded-md"
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
          className="w-full rounded-md"
          disabled={!startDate || !endDate}
          type="submit"
        >
          Submit
        </Button>
      </form>

      <ClientMonitoringChart
        startDate={queryParams.startDate}
        endDate={queryParams.endDate}
        chartData={chartData || []}
        chartConfig={chartConfig}
      />
    </div>
  );
};

export default ClientMonitoringSection;
