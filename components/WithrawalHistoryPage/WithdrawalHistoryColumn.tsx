import { Button } from "@/components/ui/button";
import { formatDateToYYYYMMDD, formatTime } from "@/utils/function";
import { WithdrawalRequestData } from "@/utils/types";
import { DialogClose } from "@radix-ui/react-dialog";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

const statusColorMap: Record<string, string> = {
  APPROVED: "bg-green-500 dark:bg-green-600 dark:text-white",
  REJECTED: "bg-red-500 dark:bg-red-600 dark:text-white",
  PENDING: "bg-yellow-500 dark:bg-yellow-600 dark:text-white",
};

export const WithdrawalHistoryColumn =
  (): ColumnDef<WithdrawalRequestData>[] => {
    return [
      {
        accessorKey: "alliance_withdrawal_request_status",

        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => {
          const status = row.getValue(
            "alliance_withdrawal_request_status"
          ) as string;
          const color = statusColorMap[status.toUpperCase()] || "gray"; // Default to gray if status is undefined
          return (
            <div className="flex justify-center items-center gap-2 text-wrap w-full">
              <Badge className={`${color} text-white`}>{status}</Badge>
            </div>
          );
        },
      },

      {
        accessorKey: "alliance_withdrawal_request_amount",
        header: () => <Button variant="ghost">Amount</Button>,
        cell: ({ row }) => {
          const amount = parseFloat(
            row.getValue("alliance_withdrawal_request_amount")
          );
          const fee = row.original.alliance_withdrawal_request_fee;
          const formatted = new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(amount - fee);
          return <div className="font-medium text-center">{formatted}</div>;
        },
      },
      {
        accessorKey: "alliance_withdrawal_request_type",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "desc")
            }
          >
            Bank Type <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("alliance_withdrawal_request_type")}
          </div>
        ),
      },
      {
        accessorKey: "alliance_withdrawal_request_bank_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bank Name <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => {
          const value = row.getValue(
            "alliance_withdrawal_request_bank_name"
          ) as string;
          return (
            <div className="flex items-center gap-2 text-center">
              <span>{value}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "alliance_withdrawal_request_account",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-1"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "desc")
            }
          >
            Bank Account <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => {
          const value = row.getValue(
            "alliance_withdrawal_request_account"
          ) as string;
          return (
            <div className="flex items-center gap-2 text-center">
              <span>{value}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "alliance_withdrawal_request_withdraw_type",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-1"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "desc")
            }
          >
            Type <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("alliance_withdrawal_request_withdraw_type")}
          </div>
        ),
      },
      {
        accessorKey: "alliance_withdrawal_request_date",

        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date Created <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {formatDateToYYYYMMDD(
              row.getValue("alliance_withdrawal_request_date")
            ) +
              ", " +
              formatTime(row.getValue("alliance_withdrawal_request_date"))}
          </div>
        ),
      },
      {
        accessorKey: "alliance_withdrawal_request_date_updated",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date Updated <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("alliance_withdrawal_request_date_updated")
              ? formatDateToYYYYMMDD(
                  row.getValue("alliance_withdrawal_request_date_updated")
                ) +
                ", " +
                formatTime(
                  row.getValue("alliance_withdrawal_request_date_updated")
                )
              : ""}
          </div>
        ),
      },
      {
        accessorKey: "alliance_withdrawal_request_reject_note",
        header: () => <div>Rejection Note</div>,
        cell: ({ row }) => {
          const rejectionNote = row.getValue(
            "alliance_withdrawal_request_reject_note"
          ) as string;

          return rejectionNote ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">View Rejection Note</Button>
              </DialogTrigger>
              <DialogContent type="table">
                <DialogHeader>
                  <DialogTitle>Rejection Note</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center items-center">
                  <Textarea value={rejectionNote} readOnly />
                </div>
                <DialogClose asChild>
                  <Button variant="secondary">Close</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          ) : null;
        },
      },
    ];
  };
