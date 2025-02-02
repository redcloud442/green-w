import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/services/Error/ErrorLogs";
import { updateTopUpStatus } from "@/services/TopUp/Admin";
import { formatDateToYYYYMMDD, formatTime } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { AdminTopUpRequestData, TopUpRequestData } from "@/utils/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";
import { Badge } from "../ui/badge";
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
  APPROVED: "bg-green-500 dark:bg-green-500 dark:text-white",
  PENDING: "bg-yellow-600 dark:bg-yellow-600 dark:text-white",
  REJECTED: "bg-red-600 dark:bg-red-600 dark:text-white",
};

export const TopUpColumn = (
  setRequestData: Dispatch<SetStateAction<AdminTopUpRequestData | null>>,
  reset: () => void
) => {
  const { toast } = useToast();
  const supabaseClient = createClientSide();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState({
    open: false,
    requestId: "",
    status: "",
    amount: 0,
  });

  const handleUpdateStatus = async (
    status: string,
    requestId: string,
    note?: string
  ) => {
    try {
      setIsLoading(true);

      await updateTopUpStatus(
        {
          status,
          requestId,
          note,
        },
        supabaseClient
      );

      setRequestData((prev) => {
        if (!prev) return prev;

        const pendingData = prev.data["PENDING"]?.data ?? [];
        const updatedItem = pendingData.find(
          (item) => item.alliance_top_up_request_id === requestId
        );
        const newPendingList = pendingData.filter(
          (item) => item.alliance_top_up_request_id !== requestId
        );
        const currentStatusData = prev.data[status as keyof typeof prev.data];
        const hasExistingData = currentStatusData?.data?.length > 0;

        const merchantBalance =
          status === "APPROVED"
            ? (prev.merchantBalance || 0) -
              (updatedItem?.alliance_top_up_request_amount ?? 0)
            : prev.merchantBalance;

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
                      alliance_top_up_request_status: status,
                      alliance_top_up_request_date_updated: new Date(),
                    },
                    ...currentStatusData.data,
                  ]
                : [],
              count: Number(currentStatusData?.count || 0) + 1,
            },
          },
          merchantBalance: merchantBalance,
        };
      });
      toast({
        title: `Status Update`,
        description: `${status} Request Successfully`,
        variant: "success",
      });

      setIsOpenModal({ open: false, requestId: "", status: "", amount: 0 });
      reset();
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath:
            "components/AdminTopUpApprovalPage/AdminTopUpApprovalColumn.tsx",
        });
        toast({
          title: `Invalid Request`,
          description: `${e.message}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<TopUpRequestData>[] = [
    {
      accessorKey: "user_username",

      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Requestor Username <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">{row.getValue("user_username")}</div>
      ),
    },
    {
      accessorKey: "alliance_top_up_request_status",

      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("alliance_top_up_request_status") as string;
        const color = statusColorMap[status.toUpperCase()] || "gray"; // Default to gray if status is undefined
        return <Badge className={`${color}`}>{status}</Badge>;
      },
    },

    {
      accessorKey: "alliance_top_up_request_amount",

      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(
          row.getValue("alliance_top_up_request_amount")
        );
        const formatted = new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(amount);
        return <div className="font-medium text-wrap">{formatted}</div>;
      },
    },
    {
      accessorKey: "alliance_top_up_request_name",
      header: ({ column }) => (
        <Button
          className="p-1"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">
          {row.getValue("alliance_top_up_request_name")}
        </div>
      ),
    },
    {
      accessorKey: "alliance_top_up_request_type",

      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Bank Name <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">
          {row.getValue("alliance_top_up_request_type")}
        </div>
      ),
    },
    {
      accessorKey: "alliance_top_up_request_account",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Bank Account <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">
          {row.getValue("alliance_top_up_request_account")}
        </div>
      ),
    },
    {
      accessorKey: "alliance_top_up_request_date",

      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date Created <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">
          {formatDateToYYYYMMDD(row.getValue("alliance_top_up_request_date"))},
          {formatTime(row.getValue("alliance_top_up_request_date"))}
        </div>
      ),
    },
    {
      accessorKey: "alliance_top_up_request_attachment",
      header: () => <div className="p-1">Attachment</div>,
      cell: ({ row }) => {
        const attachmentUrl = row.getValue(
          "alliance_top_up_request_attachment"
        ) as string;

        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">View Attachment</Button>
            </DialogTrigger>
            <DialogContent type="table">
              <DialogHeader>
                <DialogTitle>Attachment</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center items-center">
                <Image
                  width={100}
                  height={100}
                  src={attachmentUrl || ""}
                  alt="Attachment Preview"
                  className="object-contain w-full h-full"
                />
              </div>
              <DialogClose asChild>
                <Button variant="secondary">Close</Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        );
      },
    },
    {
      accessorKey: "alliance_top_up_request_reject_note",

      header: () => <div>Rejection Note</div>,
      cell: ({ row }) => {
        const rejectionNote = row.getValue(
          "alliance_top_up_request_reject_note"
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
    {
      header: "Actions",
      cell: ({ row }) => {
        const data = row.original;

        return (
          <>
            {data.alliance_top_up_request_status === "PENDING" && (
              <div className="flex gap-2">
                <Button
                  className="bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:text-white"
                  onClick={() =>
                    setIsOpenModal({
                      open: true,
                      requestId: data.alliance_top_up_request_id,
                      status: "APPROVED",
                      amount: Number(data.alliance_top_up_request_amount) || 0,
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
                      requestId: data.alliance_top_up_request_id,
                      status: "REJECTED",
                      amount: 0,
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
  ];

  return {
    columns,
    isOpenModal,
    setIsOpenModal,
    handleUpdateStatus,
    isLoading,
  };
};
