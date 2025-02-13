import { Button } from "@/components/ui/button";
import { formatDateToYYYYMMDD, formatDay, formatTime } from "@/utils/function";
import { adminUserReinvestedReportData } from "@/utils/types";
import { ColumnDef } from "@tanstack/react-table";

export const AdminUserReinvestedColumn =
  (): ColumnDef<adminUserReinvestedReportData>[] => {
    return [
      {
        accessorKey: "package_member_connection_created",
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
            <div className="flex items-center gap-2 text-wrap ">
              {formatDay(row.original.package_member_connection_created)},{" "}
              {formatDateToYYYYMMDD(
                row.original.package_member_connection_created
              )}
              , {formatTime(row.original.package_member_connection_created)}
            </div>
          );
        },
      },
      {
        accessorKey: "package_member_amount",
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
            <div className="flex items-center gap-2 text-wrap ">
              ₱
              {row.original.package_member_amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          );
        },
      },
      {
        accessorKey: "user_username",
        header: "User",
        cell: ({ row }) => {
          return <div>{row.original.user_username}</div>;
        },
      },
      {
        accessorKey: "user_first_name",
        header: "Full Name",
        cell: ({ row }) => {
          return (
            <div>
              {row.original.user_first_name} {row.original.user_last_name}
            </div>
          );
        },
      },
    ];
  };
