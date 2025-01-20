import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logError } from "@/services/Error/ErrorLogs";
import { formatDateToYYYYMMDD } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { UserRequestdata } from "@/utils/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TableLoading from "../ui/tableLoading";

export const AdminUsersColumn = (
  handleCopyAccountUrl: (userName: string) => void
) => {
  const supabaseClient = createClientSide();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState({
    open: false,
    role: "",
    memberId: "",
    type: "",
  });

  const handlePromoteToMerchant = async (
    alliance_member_alliance_id: string,
    role: string
  ) => {
    try {
      setIsOpenModal({
        open: true,
        role: role,
        memberId: alliance_member_alliance_id,
        type: "PROMOTE",
      });

      // await handleUpdateRole({ userId: alliance_member_alliance_id, role });

      // if (role === "ADMIN") {
      //   const supabase = createServiceRoleClient();
      //   const { data, error } = await supabase.auth.admin.updateUserById(
      //     userId,
      //     {
      //       password: newPassword,
      //     }
      //   );
      // }
      // toast({
      //   title: `Role Updated`,
      //   description: `Role Updated Sucessfully`,
      //   variant: "success",
      // });
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/AdminUsersPage/AdminUsersColumn.tsx",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (alliance_member_alliance_id: string) => {
    try {
      setIsOpenModal({
        open: true,
        role: "",
        memberId: alliance_member_alliance_id,
        type: "BAN",
      });

      // await handleUpdateUserRestriction({
      //   userId: alliance_member_alliance_id,
      // });
      // handleFetch();
      // toast({
      //   title: `User Banned`,
      //   description: `User Banned Sucessfully`,
      //   variant: "success",
      // });
    } catch (e) {
    } finally {
    }
  };

  if (isLoading) {
    <TableLoading />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<UserRequestdata, any>[] = [
    {
      accessorKey: "user_username",

      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Username <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div
          onClick={() =>
            router.push(`/admin/users/${row.original.alliance_member_user_id}`)
          }
          className="text-blue-500 text-wrap cursor-pointer hover:underline"
        >
          {row.getValue("user_username")}
        </div>
      ),
    },

    {
      accessorKey: "alliance_member_id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Access Account Link <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const userName = row.original.user_username as string;
        return (
          <Button
            variant="card"
            onClick={() => handleCopyAccountUrl(userName)}
            className="rounded-md"
          >
            Access Account Link
          </Button>
        );
      },
    },
    {
      accessorKey: "alliance_member_role",

      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">{row.getValue("alliance_member_role")}</div>
      ),
    },
    {
      accessorKey: "user_first_name",

      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          First Name <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">{row.getValue("user_first_name")}</div>
      ),
    },
    {
      accessorKey: "user_last_name",

      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Name <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">{row.getValue("user_last_name")}</div>
      ),
    },
    {
      accessorKey: "user_date_created",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date Created <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">
          {formatDateToYYYYMMDD(row.getValue("user_date_created"))}
        </div>
      ),
    },
    {
      accessorKey: "alliance_member_restricted",

      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Restricted <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-wrap">
          {row.getValue("alliance_member_restricted") ? "YES" : "NO"}
        </div>
      ),
    },

    {
      accessorKey: "alliance_member_is_active",

      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Active <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const isActive = row.getValue("alliance_member_is_active");
        return (
          <div
            className={`${isActive ? "text-green-500" : "text-red-500"} text-wrap`}
          >
            {isActive ? "YES" : "NO"}
          </div>
        );
      },
    },
    {
      header: "Actions",
      cell: ({ row }) => {
        const data = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {data.alliance_member_role !== "MERCHANT" && (
                <DropdownMenuItem
                  onClick={() =>
                    handlePromoteToMerchant(data.alliance_member_id, "MERCHANT")
                  }
                >
                  Promote as Merchant
                </DropdownMenuItem>
              )}
              {data.alliance_member_role !== "ADMIN" && (
                <DropdownMenuItem
                  onClick={() =>
                    handlePromoteToMerchant(data.alliance_member_id, "ADMIN")
                  }
                >
                  Promote as Admin
                </DropdownMenuItem>
              )}
              {data.alliance_member_role !== "ACCOUNTING" && (
                <DropdownMenuItem
                  onClick={() =>
                    handlePromoteToMerchant(
                      data.alliance_member_id,
                      "ACCOUNTING"
                    )
                  }
                >
                  Promote as Accountant
                </DropdownMenuItem>
              )}

              {data.alliance_member_role !== "MEMBER" && (
                <DropdownMenuItem
                  onClick={() =>
                    handlePromoteToMerchant(data.alliance_member_id, "MEMBER")
                  }
                >
                  Promote as Member
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleBanUser(data.alliance_member_id)}
              >
                Ban User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  return { columns, isOpenModal, setIsOpenModal, setIsLoading, isLoading };
};
