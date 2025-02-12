import { Button } from "@/components/ui/button";
import { formatDateToYYYYMMDD, formatDay } from "@/utils/function";
import { adminWithdrawalTotalReportData } from "@/utils/types";
import { ColumnDef } from "@tanstack/react-table";

export const AdminWithdrawalReportColumn =
  (): ColumnDef<adminWithdrawalTotalReportData>[] => {
    return [
      {
        accessorKey: "interval_start",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date Start
          </Button>
        ),
        cell: ({ row }) => {
          // Get the original date
          const originalDate = new Date(row.original.interval_start);

          // Add one day
          const newDate = new Date(originalDate);
          newDate.setDate(newDate.getDate() + 1);

          // Format the new date as YYYY-MM-DD
          const formattedDate = newDate.toISOString().split("T")[0];

          return (
            <div className="flex items-center gap-2 text-wrap">
              {formatDay(originalDate)}, {formattedDate}
            </div>
          );
        },
      },
      {
        accessorKey: "total_admin_approvals",
        header: ({ column }) => (
          <Button
            className="p-0"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Admin Approvals
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("total_admin_approvals")}
          </div>
        ),
      },
      {
        accessorKey: "total_admin_approved_amount",
        header: ({ column }) => (
          <Button
            className="p-1"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Admin Approved Amount
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-center text-green-500">
            ₱
            {Number(row.getValue("total_admin_approved_amount")).toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </div>
        ),
      },
      {
        accessorKey: "total_accounting_approvals",
        header: ({ column }) => (
          <Button
            className="p-1"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Accounting Approvals
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("total_accounting_approvals")}
          </div>
        ),
      },
      {
        accessorKey: "total_accounting_approved_amount",
        header: ({ column }) => (
          <Button
            className="p-1"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Accounting Approved Amount
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-center text-green-500">
            ₱
            {Number(
              row.getValue("total_accounting_approved_amount")
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        ),
      },
      {
        accessorKey: "interval_end",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date End
          </Button>
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 text-wrap ">
              {formatDay(row.original.interval_end)},{" "}
              {formatDateToYYYYMMDD(row.original.interval_end)}
            </div>
          );
        },
      },
      {
        accessorKey: "total_net_approved_amount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Net Approved Amount
          </Button>
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 text-wrap text-green-500 ">
              ₱
              {Number(row.getValue("total_net_approved_amount")).toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </div>
          );
        },
      },
    ];
  };
