"use client";

import { toast } from "@/hooks/use-toast";
import {
  deleteAdminWithdrawalBanList,
  getAdminWithdrawalBanList,
} from "@/services/Withdrawal/Admin";
import { createClientSide } from "@/utils/supabase/client";
import { alliance_member_table } from "@prisma/client";
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  Table,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import ReusableTable from "../ReusableTable/ReusableTable";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Separator } from "../ui/separator";
import { AdminWithdrawalBanColumn } from "./AdminWithdrawalBanColumn";

type DataTableProps = {
  teamMemberProfile: alliance_member_table;
  sponsor?: string;
  requestData: { accountNumber: string }[];
  requestCount: number;
  setRequestCount: Dispatch<SetStateAction<number>>;
  setRequestData: Dispatch<SetStateAction<{ accountNumber: string }[]>>;
};

const AdminBanListTable = ({
  teamMemberProfile,
  requestData,
  requestCount,
  setRequestCount,
  setRequestData,
}: DataTableProps) => {
  const supabaseClient = createClientSide();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [activePage, setActivePage] = useState(1);

  const [isFetchingList, setIsFetchingList] = useState(false);

  const fetchAdminRequest = async () => {
    try {
      if (!teamMemberProfile) return;
      setIsFetchingList(true);

      const { data, totalCount } = await getAdminWithdrawalBanList({
        take: 10,
        skip: activePage,
      });

      setRequestData(data || []);
      setRequestCount(totalCount || 0);
    } catch (e) {
    } finally {
      setIsFetchingList(false);
    }
  };

  const handleDeleteBanList = async (accountNumber: string) => {
    try {
      setIsLoading(true);

      await deleteAdminWithdrawalBanList({ accountNumber });

      setRequestCount((prev) => prev - 1);
      setRequestData((prev) =>
        prev.filter((item) => item.accountNumber !== accountNumber)
      );

      toast({
        title: "Successfully deleted ban list",
      });
    } catch (e) {
      if (e instanceof Error) {
        toast({
          title: "Failed to delete ban list",
          description: e.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const columns = AdminWithdrawalBanColumn(handleDeleteBanList, isLoading);

  const table = useReactTable({
    data: requestData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  useEffect(() => {
    fetchAdminRequest();
  }, [supabaseClient, teamMemberProfile, activePage, sorting]);

  const pageCount = Math.ceil(requestCount / 10);

  return (
    <Card className="w-full">
      <CardHeader className="text-center text-[30px] sm:text-[60px] font-extrabold"></CardHeader>
      <Separator />
      <CardContent className="space-y-4">
        <ReusableTable
          table={table as unknown as Table<object>}
          columns={columns as ColumnDef<object>[]}
          activePage={activePage}
          totalCount={requestCount}
          isFetchingList={isFetchingList}
          setActivePage={setActivePage}
          pageCount={pageCount}
        />
      </CardContent>
    </Card>
  );
};

export default AdminBanListTable;
