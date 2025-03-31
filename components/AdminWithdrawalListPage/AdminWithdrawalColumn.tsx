import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateWithdrawalStatus } from "@/services/Withdrawal/Admin";
import {
  formatAccountNumber,
  formatDateToYYYYMMDD,
  formatTime,
} from "@/utils/function";
import { AdminWithdrawaldata, WithdrawalRequestData } from "@/utils/types";
import { Column, ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpDown, ClipboardCopy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

import { user_table } from "@prisma/client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

const statusColorMap: Record<string, string> = {
  APPROVED: "bg-green-500 dark:bg-green-600 dark:text-white",
  PENDING: "bg-yellow-600 dark:bg-yellow-700 dark:text-white",
  REJECTED: "bg-red-600 dark:bg-red-700 dark:text-white",
};
export const AdminWithdrawalHistoryColumn = (
  reset: () => void,
  profile: user_table,
  setRequestData: Dispatch<SetStateAction<AdminWithdrawaldata | null>>,
  status: "PENDING" | "APPROVED" | "REJECTED"
) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState({
    open: false,
    requestId: "",
    status: "",
  });

  const handleUpdateStatus = async (
    status: string,
    requestId: string,
    note?: string
  ) => {
    try {
      setIsLoading(true);
      await updateWithdrawalStatus({ status, requestId, note });

      setRequestData((prev) => {
        if (!prev) return prev;

        // Extract PENDING data and filter out the item being updated
        const pendingData = prev.data["PENDING"]?.data ?? [];
        const updatedItem = pendingData.find(
          (item) => item.alliance_withdrawal_request_id === requestId
        );
        const newPendingList = pendingData.filter(
          (item) => item.alliance_withdrawal_request_id !== requestId
        );
        const currentStatusData = prev.data[status as keyof typeof prev.data];
        const hasExistingData = currentStatusData?.data?.length > 0;

        if (!updatedItem) return prev;

        return {
          ...prev,
          data: {
            ...prev.data,
            PENDING: {
              ...prev.data["PENDING"],
              data: newPendingList,
              count: Number(prev.data["PENDING"]?.count) - 1,
            },
            [status as keyof typeof prev.data]: {
              ...currentStatusData,
              data: hasExistingData
                ? [
                    {
                      ...updatedItem,
                      alliance_withdrawal_request_status: status,
                      approver_username: profile.user_username,
                      alliance_withdrawal_request_date_updated: new Date(),
                    },
                    ...currentStatusData.data,
                  ]
                : [],
              count: Number(currentStatusData?.count || 0) + 1,
            },
          },
          totalPendingWithdrawal:
            Number(prev.totalPendingWithdrawal) -
            Number(
              updatedItem.alliance_withdrawal_request_amount -
                updatedItem.alliance_withdrawal_request_fee
            ),
        };
      });
      reset();
      setIsOpenModal({ open: false, requestId: "", status: "" });
      toast({
        title: `Status Update`,
        description: `${status} Request Successfully`,
      });
    } catch (e) {
      toast({
        title: `Status Failed`,
        description: `Something went wrong`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string, variant: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `Copied to clipboard`,
      description: `${variant} copied to clipboard`,
    });
  };

  const columns: ColumnDef<WithdrawalRequestData>[] = [
    {
      accessorKey: "user_username",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          Requestor Name <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div
          onClick={() => router.push(`/admin/users/${row.original.user_id}`)}
          className="flex items-center gap-2 text-wrap cursor-pointer hover:underline"
        >
          <Avatar>
            <AvatarImage src={row.original.user_profile_picture ?? ""} />
            <AvatarFallback>
              {row.original.user_username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <p className="text-wrap text-blue-500">
            {row.getValue("user_username")}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "alliance_withdrawal_request_status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          Status <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue(
          "alliance_withdrawal_request_status"
        ) as string;
        const color = statusColorMap[status.toUpperCase()] || "gray"; // Default to gray if status is undefined
        return <Badge className={`${color}`}>{status}</Badge>;
      },
    },

    {
      accessorKey: "alliance_withdrawal_request_amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          Amount <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(
          row.getValue("alliance_withdrawal_request_amount")
        );
        const fee = row.original.alliance_withdrawal_request_fee;
        const formatted = new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(amount - fee);
        return <div className="font-medium text-wrap">{formatted}</div>;
      },
    },
    {
      accessorKey: "alliance_withdrawal_request_type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          Bank Type <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="w-96 text-wrap">
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
          <div className="flex justify-between items-center gap-2 text-wrap w-full">
            <span>{value}</span>
            <Button
              variant="card"
              size="icon"
              onClick={() => handleCopyToClipboard(value, "Bank Name")}
              className="p-1"
            >
              <ClipboardCopy className="w-3 h-3" />
            </Button>
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
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          Bank Account <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue(
          "alliance_withdrawal_request_account"
        ) as string;
        return (
          <div className="flex justify-between items-center gap-2 text-wrap w-full">
            <span>{formatAccountNumber(value)}</span>
            <Button
              variant="card"
              size="icon"
              onClick={() => handleCopyToClipboard(value, "Bank Account")}
              className="p-1"
            >
              <ClipboardCopy className="w-3 h-3" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "alliance_withdrawal_request_date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          Date Created <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap w-40">
          {formatDateToYYYYMMDD(
            row.getValue("alliance_withdrawal_request_date")
          )}
          , {formatTime(row.getValue("alliance_withdrawal_request_date"))}
        </div>
      ),
    },
    {
      accessorKey: "alliance_withdrawal_request_withdraw_type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          Type <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">
          {row.getValue("alliance_withdrawal_request_withdraw_type")}
        </div>
      ),
    },

    {
      accessorKey: "approver_username",
      header: ({ column }: { column: Column<WithdrawalRequestData> }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          Approver <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }: { row: Row<WithdrawalRequestData> }) => (
        <div className="flex items-center gap-2 text-wrap cursor-pointer hover:underline">
          {row.original.approver_username ? (
            <>
              <Avatar>
                <AvatarImage
                  src={row.original.approver_profile_picture ?? ""}
                />
                <AvatarFallback>
                  {row.original.approver_username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <p
                onClick={() =>
                  router.push(`/admin/users/${row.original.approver_id}`)
                }
                className="text-wrap text-blue-500 underline"
              >
                {row.getValue("approver_username")}
              </p>
            </>
          ) : null}
        </div>
      ),
    },
    ...(status !== "PENDING"
      ? [
          {
            accessorKey: "alliance_withdrawal_request_date_updated",
            header: ({ column }: { column: Column<WithdrawalRequestData> }) => (
              <Button
                variant="ghost"
                className="p-1"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "desc")
                }
              >
                Date Updated <ArrowUpDown />
              </Button>
            ),
            cell: ({ row }: { row: Row<WithdrawalRequestData> }) => (
              <div className="text-wrap w-40">
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
        ]
      : []),
    ...(status === "REJECTED"
      ? [
          {
            accessorKey: "alliance_withdrawal_request_reject_note",
            header: () => <div className="p-1">Rejection Note</div>,
            cell: ({ row }: { row: Row<WithdrawalRequestData> }) => {
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
        ]
      : []),
    ...(status === "PENDING"
      ? [
          {
            header: "Actions",
            cell: ({ row }: { row: Row<WithdrawalRequestData> }) => {
              const data = row.original;
              return (
                <>
                  {data.alliance_withdrawal_request_status === "PENDING" && (
                    <div className="flex justify-center gap-2">
                      <Button
                        className="bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:text-white "
                        onClick={() =>
                          setIsOpenModal({
                            open: true,
                            requestId: data.alliance_withdrawal_request_id,
                            status: "APPROVED",
                          })
                        }
                      >
                        Approve
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() =>
                          setIsOpenModal({
                            open: true,
                            requestId: data.alliance_withdrawal_request_id,
                            status: "REJECTED",
                          })
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </>
              );
            },
          },
        ]
      : []),
  ];

  return {
    columns,
    isOpenModal,
    setIsOpenModal,
    handleUpdateStatus,
    isLoading,
  };
};
