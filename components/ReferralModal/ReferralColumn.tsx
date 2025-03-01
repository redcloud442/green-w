import { user_table } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export const ReferralColumn = (
  pageIndex: number,
  pageSize: number
): ColumnDef<user_table>[] => {
  return [
    {
      id: "index",
      header: () => <div className="text-center text-lg font-bold"></div>,
      cell: ({ row }) => {
        const rowNumber = row.index + 1 + (pageIndex - 1) * pageSize;
        return <div className="text-center">{rowNumber}</div>;
      },
    },

    {
      accessorKey: "user_username",
      header: () => (
        <div className="text-center text-lg font-bold">Username</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("user_username")}</div>
      ),
    },
  ];
};
