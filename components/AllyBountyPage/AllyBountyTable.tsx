"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllyBounty } from "@/services/Bounty/Member";
import { escapeFormData } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { alliance_member_table, user_table } from "@prisma/client";
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ReferralModal from "../ReferralModal/ReferralModal";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import TableLoading from "../ui/tableLoading";
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
    <ScrollArea className="w-full overflow-x-auto ">
      {isFetchingList && <TableLoading />}
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
          <Table className="w-full border-collapse border border-white font-bold">
            <TableHeader className="border-b border-white text-white font-bold">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-white text-blue-500 font-bold"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      className="border-r border-white px-4 py-2 text-blue-500 hover:bg-transparent font-bold"
                      key={header.id}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-none font-bold"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        className="border-r border-white px-4 py-2"
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-b border-black">
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center border-r border-white"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <ScrollBar orientation="horizontal" />

          <div className="flex items-center justify-start gap-x-4">
            {/* Left Arrow */}
            <Button
              variant="card"
              className="shadow-none"
              size="sm"
              onClick={() => setActivePage((prev) => Math.max(prev - 1, 1))}
              disabled={activePage <= 1}
            >
              <ChevronLeft />
            </Button>

            {/* Active Page */}
            <span className="text-lg font-semibold">{activePage}</span>

            {/* Right Arrow */}
            <Button
              variant="card"
              className="shadow-none"
              size="sm"
              onClick={() =>
                setActivePage((prev) => Math.min(prev + 1, pageCount))
              }
              disabled={activePage >= pageCount}
            >
              <ChevronRight />
            </Button>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
};

export default AllyBountyTable;
