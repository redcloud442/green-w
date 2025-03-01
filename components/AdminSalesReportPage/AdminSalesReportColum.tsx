import { Button } from "@/components/ui/button";
import { formatDateToYYYYMMDD, formatDay } from "@/utils/function";
import { adminSalesReportData } from "@/utils/types";
import { ColumnDef } from "@tanstack/react-table";

export const AdminSalesReportColumn = (): ColumnDef<adminSalesReportData>[] => {
  return [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <div className="flex justify-center items-center gap-2 text-center ">
            {formatDay(row.original.date)},{" "}
            {formatDateToYYYYMMDD(row.original.date)}
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2 text-center ">
            ₱
            {row.original.amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      },
    },
  ];
};
