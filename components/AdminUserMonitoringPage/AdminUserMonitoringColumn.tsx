import { Button } from "@/components/ui/button";
import { user_table } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const AdminUserMonitoringColumn = (): ColumnDef<
  user_table & { alliance_olympus_wallet: number }
>[] => {
  const router = useRouter();
  return [
    {
      accessorKey: "user_username",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Username
        </Button>
      ),
      cell: ({ row }) => {
        const id = row.original.user_id;
        return (
          <div
            onClick={() => router.push(`/admin/users/${id}`)}
            className="flex items-center gap-2 text-wrap cursor-pointer hover:underline"
          >
            <Avatar>
              <AvatarImage src={row.original.user_profile_picture ?? ""} />

              <AvatarFallback>
                {row.original.user_username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <p className="text-wrap text-blue-500 underline">
              {row.getValue("user_username")}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "user_first_name",
      header: ({ column }) => (
        <Button
          className="w-full"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          First Name
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("user_first_name")}</div>
      ),
    },
    {
      accessorKey: "user_last_name",
      header: ({ column }) => (
        <Button
          className="w-full"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Name
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("user_last_name")}</div>
      ),
    },
    {
      accessorKey: "alliance_olympus_wallet",
      header: ({ column }) => (
        <Button
          className="w-full"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Wallet Balance
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("alliance_olympus_wallet"));
        const formatted = new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(amount);
        return <div className="font-medium text-center">{formatted}</div>;
      },
    },
  ];
};
