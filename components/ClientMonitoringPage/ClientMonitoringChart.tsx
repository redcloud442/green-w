import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatMonthDateYear } from "@/utils/function";
import { ChartDataClientMonitoring } from "@/utils/types";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Button } from "../ui/button";

type ChartConfig = {
  [key: string]: { label: string; color?: string };
};

type ClientMonitoringChartProps = {
  startDate: string;
  endDate: string;
  chartData: ChartDataClientMonitoring[];
  chartConfig: ChartConfig;
};

export const ClientMonitoringChart: React.FC<ClientMonitoringChartProps> = ({
  startDate,
  endDate,
  chartData,
  chartConfig,
}) => {
  const [activeChart, setActiveChart] = React.useState<string>(
    Object.keys(chartConfig)[0]
  );

  const total = React.useMemo(() => {
    const totals: Record<string, number> = {};
    Object.keys(chartConfig).forEach((key) => {
      totals[key] = chartData.reduce(
        (acc, curr) => acc + (curr[key] as number),
        0
      );
    });
    return totals;
  }, [chartData, chartConfig]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Daily and Monthly Deposits</CardTitle>
          <CardDescription>
            Showing total daily and monthly deposits for{" "}
            {startDate && endDate
              ? `${formatMonthDateYear(new Date(startDate))} - ${formatMonthDateYear(new Date(endDate))}`
              : "this month"}
          </CardDescription>
        </div>
        <div className="flex pt-0 sm:pt-4">
          {Object.keys(chartConfig).map((key) => {
            if (key === "views") return null;
            return (
              <Button
                key={key}
                variant="ghost"
                data-active={activeChart === key}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-10 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(key)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[key].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  ₱ {total[key].toLocaleString()}
                </span>
              </Button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={true}
              axisLine={true}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey={activeChart}
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill={chartConfig[activeChart]?.color || "#8884d8"}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
