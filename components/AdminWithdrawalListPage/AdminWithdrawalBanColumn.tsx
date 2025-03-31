import { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";

export const AdminWithdrawalBanColumn = (
  handleDeleteBanList: (accountNumber: string) => void,
  isLoading: boolean
): ColumnDef<{
  accountNumber: string;
}>[] => {
  return [
    {
      accessorKey: "accountNumber",
      header: () => (
        <div className="text-center text-lg font-bold">Account Number</div>
      ),
      cell: ({ row }) => {
        const accountNumber = row.getValue("accountNumber") as string;

        return <div className="text-start">{accountNumber}</div>;
      },
    },
    {
      header: "Actions",
      cell: ({ row }) => {
        const accountNumber = row.original.accountNumber;

        return (
          <div className="flex justify-center items-center">
            <Button
              className="rounded-md"
              variant="destructive"
              onClick={() => handleDeleteBanList(accountNumber)}
              disabled={isLoading}
            >
              <Trash2 />
            </Button>
          </div>
        );
      },
    },
  ];
};
