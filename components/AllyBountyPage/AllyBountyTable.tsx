"use client";

import { getAllyBounty } from "@/services/Bounty/Member";
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
import ReferralModal from "../ReferralModal/ReferralModal";
import ReusableTable from "../ReusableTable/ReusableTable";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { AllyBountyColumn } from "./AllyBountyColum";
type DataTableProps = {
  teamMemberProfile: alliance_member_table;
  sponsor?: string;
};

type FilterFormValues = {
  emailFilter: string;
};

const AllyBountyTable = ({ teamMemberProfile }: DataTableProps) => {
  const supabaseClient = createClientSide();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [requestData, setRequestData] = useState<
    (user_table & {
      total_bounty_earnings: string;
      package_ally_bounty_log_date_created: string;
    })[]
  >([]);
  const [requestCount, setRequestCount] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [isFetchingList, setIsFetchingList] = useState(false);

  const columnAccessor = sorting?.[0]?.id || "user_date_created";
  const isAscendingSort =
    sorting?.[0]?.desc === undefined ? true : !sorting[0].desc;

  const fetchAdminRequest = async () => {
    try {
      if (!teamMemberProfile) return;
      setIsFetchingList(true);

      const sanitizedData = escapeFormData(getValues());

      const { emailFilter } = sanitizedData;

      const { data, totalCount, totalReferralCountDirect } =
        await getAllyBounty({
          page: activePage,
          limit: 10,
          columnAccessor: columnAccessor,
          isAscendingSort: isAscendingSort,
          search: emailFilter,
        });

      setRequestData(data || []);
      setRequestCount(totalCount || 0);
      setReferralCount(totalReferralCountDirect || 0);
    } catch (e) {
    } finally {
      setIsFetchingList(false);
    }
  };

  const columns = AllyBountyColumn();

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
      emailFilter: "",
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
    <Card className="w-full p-4">
      <CardHeader className="text-center text-[30px] sm:text-[60px] font-extrabold">
        <CardTitle>REFERRAL INCOME</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4">
        <div className="flex justify-between items-end flex-wrap gap-4">
          <form
            className="flex gap-2 pt-4 w-full sm:w-auto"
            onSubmit={handleSubmit(handleFilter)}
          >
            <Input
              {...register("emailFilter")}
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

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-bold ">
              Total Referral Count: {referralCount}
            </span>
            <ReferralModal teamMemberProfile={teamMemberProfile} />
          </div>
        </div>
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

export default AllyBountyTable;
