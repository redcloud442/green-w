import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/services/Error/ErrorLogs";
import { updateTopUpStatus } from "@/services/TopUp/Admin";
import { formatDateToYYYYMMDD, formatTime } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { AdminTopUpRequestData, TopUpRequestData } from "@/utils/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { AspectRatio } from "../ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import TableLoading from "../ui/tableLoading";
import { Textarea } from "../ui/textarea";
const statusColorMap: Record<string, string> = {
  APPROVED: "bg-green-500 dark:bg-green-600 dark:text-white",
  PENDING: "bg-yellow-600 dark:bg-yellow-700 dark:text-white",
  REJECTED: "bg-red-600 dark:bg-red-700 dark:text-white",
};

export const useAdminTopUpApprovalColumns = (
  handleFetch: () => void,
  setRequestData: Dispatch<SetStateAction<AdminTopUpRequestData | null>>
) => {
  const { toast } = useToast();
  const router = useRouter();
  const supabaseClient = createClientSide();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState({
    open: false,
    requestId: "",
    status: "",
  });

  const handleUpdateStatus = useCallback(
    async (status: string, requestId: string, note?: string) => {
      try {
        setIsLoading(true);
        await updateTopUpStatus({ status, requestId, note }, supabaseClient);

        setRequestData((prev) => {
          if (!prev) return prev;

          // Extract PENDING data and filter out the item being updated
          const pendingData = prev.data["PENDING"]?.data ?? [];
          const updatedItem = pendingData.find(
            (item) => item.alliance_top_up_request_id === requestId
          );
          const newPendingList = pendingData.filter(
            (item) => item.alliance_top_up_request_id !== requestId
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
                        alliance_top_up_request_status: status,
                        alliance_top_up_request_date_updated: new Date(),
                      },
                      ...currentStatusData.data,
                    ]
                  : [],
                count: Number(currentStatusData?.count || 0) + 1,
              },
            },
          };
        });

        toast({
          title: `Status Update`,
          description: `${status} Request Successfully`,
        });
        setIsOpenModal({ open: false, requestId: "", status: "" });
      } catch (e) {
        if (e instanceof Error) {
          await logError(supabaseClient, {
            errorMessage: e.message,
            stackTrace: e.stack,
            stackPath:
              "components/AdminTopUpApprovalPage/AdminTopUpApprovalColumn.tsx",
          });
        }
        toast({
          title: `Status Failed`,
          description: `Something went wrong`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [handleFetch, toast]
  );

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
      accessorKey: "user_first_name",

      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Full Name <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const fullName = `${row.original.user_first_name} ${row.original.user_last_name}`;
        return <div className="text-wrap">{fullName}</div>;
      },
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
        const color = statusColorMap[status.toUpperCase()] || "gray";
        return <Badge className={`${color} text-white`}>{status}</Badge>;
      },
    },
    {
      accessorKey: "alliance_top_up_request_amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-1"
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
        return <div className="font-medium text-center">{formatted}</div>;
      },
    },
    {
      accessorKey: "alliance_top_up_request_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-1"
        >
          Bank Name <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">
          {row.getValue("alliance_top_up_request_name")}
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
      accessorKey: "alliance_top_up_request_receipt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Reference Number <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">
          {row.getValue("alliance_top_up_request_receipt")}
        </div>
      ),
    },
    {
      accessorKey: "approver_username",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-1"
        >
          Approver <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-wrap cursor-pointer hover:underline">
          {row.original.approver_username ? (
            <>
              <Avatar>
                <AvatarImage
                  src={row.original.approver_profile_picture ?? ""}
                />
                <AvatarFallback>
                  {row.original.approver_username?.charAt(0)}
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
    {
      accessorKey: "alliance_top_up_request_date_updated",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date Updated <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">
          {row.getValue("alliance_top_up_request_date_updated")
            ? formatDateToYYYYMMDD(
                row.getValue("alliance_top_up_request_date_updated")
              ) +
              ", " +
              formatTime(row.getValue("alliance_top_up_request_date_updated"))
            : ""}
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
              <DialogDescription></DialogDescription>
              <DialogHeader>
                <DialogTitle>Attachment</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center items-center border-2">
                <AspectRatio ratio={16 / 9} className="w-full">
                  <Image
                    src={attachmentUrl || ""}
                    alt="Attachment Preview"
                    width={100}
                    height={100}
                  />
                </AspectRatio>
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
                <DialogTitle>Attachment</DialogTitle>
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

  if (isLoading) {
    <TableLoading />;
  }

  return {
    columns,
    isOpenModal,
    setIsOpenModal,
    handleUpdateStatus,
    isLoading,
  };
};
