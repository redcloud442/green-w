import { formateMonthDateYear } from "@/utils/function";
import { alliance_notification_table } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export const TransactionHistoryColumn =
  (): ColumnDef<alliance_notification_table>[] => {
    return [
      {
        accessorKey: "alliance_notification_date",
        header: () => (
          <div className="text-center  text-lg  font-bold">Date</div>
        ),
        cell: ({ row }) => {
          return (
            <div className="text-center">
              {formateMonthDateYear(row.getValue("alliance_notification_date"))}
            </div>
          );
        },
      },

      {
        accessorKey: "alliance_notification_description",
        header: () => (
          <div className="text-center  text-lg  font-bold">Category</div>
        ),
        cell: ({ row }) => {
          const description = row.getValue(
            "alliance_notification_description"
          ) as string;
          return <div className=" text-center">{description}</div>;
        },
      },
    ];
  };
