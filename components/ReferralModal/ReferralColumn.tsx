import { user_table } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export const ReferralColumn = (): ColumnDef<user_table>[] => {
  return [
    {
      id: "index",
      header: () => <div className="text-center text-lg font-bold"></div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}.</div>,
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
