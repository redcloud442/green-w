import { formateMonthDateYear, formatTime } from "@/utils/function";
import { user_table } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export const AllyBountyColumn = (): ColumnDef<
  user_table & {
    total_bounty_earnings: string;
    package_ally_bounty_log_date_created: string;
  }
>[] => {
  return [
    {
      accessorKey: "package_ally_bounty_log_date_created",
      header: () => <div className="text-center text-lg font-bold">Date</div>,
      cell: ({ row }) => (
        <div className="text-wrap">
          {formateMonthDateYear(
            row.getValue("package_ally_bounty_log_date_created")
          )}
          , {formatTime(row.getValue("package_ally_bounty_log_date_created"))}
        </div>
      ),
    },
    {
      accessorKey: "user_username",
      header: () => (
        <div className="text-center text-lg font-bold">Username</div>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">{row.getValue("user_username")}</div>
      ),
    },

    {
      accessorKey: "total_bounty_earnings",
      header: () => <div className="text-center text-lg font-bold">Amount</div>,
      cell: ({ row }) => (
        <div className="text-wrap">
          ₱{" "}
          {Number(row.getValue("total_bounty_earnings")).toLocaleString(
            "en-US",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}
        </div>
      ),
    },
  ];
};
