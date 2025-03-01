"use client";

import { getReferralBounty } from "@/services/Bounty/Member";
import { escapeFormData } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { alliance_member_table, user_table } from "@prisma/client";
import {
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ReusableTable from "../ReusableTable/ReusableTable";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { ReferralColumn } from "./ReferralColumn";

type DataTableProps = {
  teamMemberProfile: alliance_member_table;
  sponsor?: string;
};

type FilterFormValues = {
  userNameFilter: string;
};

const ReferalTable = ({ teamMemberProfile }: DataTableProps) => {
  const supabaseClient = createClientSide();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [requestData, setRequestData] = useState<user_table[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [activePage, setActivePage] = useState(1);

  const [isFetchingList, setIsFetchingList] = useState(false);

  const fetchAdminRequest = async () => {
    try {
      if (!teamMemberProfile) return;
      setIsFetchingList(true);

      const sanitizedData = escapeFormData(getValues());

      const { userNameFilter } = sanitizedData;

      const { data, totalCount } = await getReferralBounty({
        page: activePage,
        limit: 10,
        search: userNameFilter,
        teamMemberId: teamMemberProfile.alliance_member_id,
      });

      setRequestData(data || []);
      setRequestCount(totalCount || 0);
    } catch (e) {
    } finally {
      setIsFetchingList(false);
    }
  };

  const columns = ReferralColumn(activePage, 10);

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

  const { getValues, handleSubmit, register } = useForm<FilterFormValues>({
    defaultValues: {
      userNameFilter: "",
    },
  });

  const handleFilter = async () => {
    try {
      await fetchAdminRequest();
    } catch (e) {}
  };

  useEffect(() => {
    fetchAdminRequest();
  }, [supabaseClient, teamMemberProfile, activePage, sorting]);

  const pageCount = Math.ceil(requestCount / 10);

  return (
    <Card className="w-full">
      <CardHeader className="text-center text-[30px] sm:text-[60px] font-extrabold">
        <CardTitle>My Referrals</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4">
        <form
          className="flex  gap-2 pt-4"
          onSubmit={handleSubmit(handleFilter)}
        >
          <Input
            {...register("userNameFilter")}
            placeholder="Filter username..."
            className="w-full sm:w-auto"
          />
          <Button
            type="submit"
            disabled={isFetchingList}
            size="sm"
            variant="card"
          >
            <Search />
          </Button>
        </form>
        <ReusableTable
          table={table}
          columns={columns}
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

export default ReferalTable;
