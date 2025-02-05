import { user_table } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export const ReferralColumn = (
  pageIndex: number,
  pageSize: number
): ColumnDef<user_table>[] => {
  const column = pageIndex + 1 + (pageIndex - 1) * pageSize;
  return [
    {
      id: "index",

      header: () => <div className="text-center text-lg font-bold"></div>,
      cell: ({ row }) => <div className="text-center">{column}.</div>,
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
  ];
};
