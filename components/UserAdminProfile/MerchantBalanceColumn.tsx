import { formateMonthDateYear } from "@/utils/function";
import { merchant_balance_log } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export const MerchantBalanceColumn = (): ColumnDef<merchant_balance_log>[] => {
  return [
    {
      accessorKey: "merchant_balance_log_date",
      header: () => <div className="text-center  text-lg  font-bold">Date</div>,
      cell: ({ row }) => {
        return (
          <div className="text-center">
            {formateMonthDateYear(row.getValue("merchant_balance_log_date"))}
          </div>
        );
      },
    },
    {
      accessorKey: "merchant_balance_log_amount",
      header: () => <div className="text-wrap text-lg font-bold">Amount</div>,
      cell: ({ row }) => {
        const merchant_balance_log_amount = row.getValue(
          "merchant_balance_log_amount"
        ) as number;
        return (
          <div className="flex items-center gap-4">
            <span>
              ₱
              {merchant_balance_log_amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "merchant_balance_log_user",
      header: () => <div className="text-center text-lg font-bold">User</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {row.getValue("merchant_balance_log_user")}
        </div>
      ),
    },
  ];
};
