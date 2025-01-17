"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logError } from "@/services/Error/ErrorLogs";
import { getMemberWithdrawalRequest } from "@/services/Withdrawal/Member";
import { escapeFormData } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { WithdrawalRequestData } from "@/utils/types";
import { alliance_member_table } from "@prisma/client";
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
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import TableLoading from "../ui/tableLoading";
import { WithdrawalHistoryColumn } from "./WithdrawalHistoryColumn";

type DataTableProps = {
  teamMemberProfile: alliance_member_table;
};

type FilterFormValues = {
  referenceId: string;
};

const WithdrawalHistoryTable = ({ teamMemberProfile }: DataTableProps) => {
  const supabaseClient = createClientSide();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [requestData, setRequestData] = useState<WithdrawalRequestData[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [isFetchingList, setIsFetchingList] = useState(false);
  const searchParams = useParams();
  const columnAccessor = sorting?.[0]?.id || "alliance_withdrawal_request_date";
  const isAscendingSort =
    sorting?.[0]?.desc === undefined ? true : !sorting[0].desc;

  const fetchRequest = async () => {
    try {
      if (!teamMemberProfile) return;
      setIsFetchingList(true);

      const sanitizedData = escapeFormData(getValues());

      const { referenceId } = sanitizedData;

      const { data, totalCount } = await getMemberWithdrawalRequest({
        teamId: teamMemberProfile.alliance_member_alliance_id,
        teamMemberId: teamMemberProfile.alliance_member_id,
        page: activePage,
        userId: searchParams?.userId?.toString() || "",
        limit: 10,
        columnAccessor: columnAccessor,
        isAscendingSort: isAscendingSort,
        search: referenceId,
      });

      setRequestData(data || []);
      setRequestCount(totalCount || 0);
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath:
            "components/WithrawalHistoryPage/WithdrawalHistoryTable.tsx",
        });
      }
    } finally {
      setIsFetchingList(false);
    }
  };

  const handleFilter = async () => {
    try {
      await fetchRequest();
    } catch (e) {}
  };

  const columns = WithdrawalHistoryColumn();

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

  const { register, handleSubmit, getValues } = useForm<FilterFormValues>({
    defaultValues: {
      referenceId: "",
    },
  });

  useEffect(() => {
    fetchRequest();
  }, [supabaseClient, teamMemberProfile, activePage, sorting]);

  const pageCount = Math.ceil(requestCount / 10);

  return (
    <ScrollArea className="w-full overflow-x-auto ">
      <Card className="w-full rounded-sm p-4">
        <h1>Withdrawal History</h1>
        <div className="flex items-center py-4">
          <form className="flex gap-2" onSubmit={handleSubmit(handleFilter)}>
            <Input
              {...register("referenceId")}
              placeholder="Filter reference id..."
              className="max-w-sm p-2 border rounded"
            />
            <Button
              type="submit"
              disabled={isFetchingList}
              size="sm"
              variant="card"
              className="w-full md:w-auto rounded-md"
            >
              <Search />
            </Button>
            <Button
              variant="card"
              className="w-full md:w-auto rounded-md"
              onClick={fetchRequest}
              disabled={isFetchingList}
              size="sm"
            >
              <RefreshCw />
              Refresh
            </Button>
          </form>
        </div>

        {isFetchingList && <TableLoading />}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <tfoot>
            <TableRow>
              <TableCell className="px-0" colSpan={columns.length}>
                <div className="flex justify-between items-center border-t px-2 pt-2">
                  <span className="text-sm text-gray-600 dark:text-white">
                    Showing {Math.min(activePage * 10, requestCount)} out of{" "}
                    {requestCount} entries
                  </span>
                </div>
              </TableCell>
            </TableRow>
          </tfoot>
        </Table>
        <ScrollBar orientation="horizontal" />

        <Separator />
        <div className="flex items-center justify-end gap-x-4 py-4">
          {activePage > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePage((prev) => Math.max(prev - 1, 1))}
              disabled={activePage <= 1}
            >
              <ChevronLeft />
            </Button>
          )}

          <div className="flex space-x-2">
            {(() => {
              const maxVisiblePages = 3;
              const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
              let displayedPages = [];

              if (pageCount <= maxVisiblePages) {
                // Show all pages if there are 3 or fewer
                displayedPages = pages;
              } else {
                if (activePage <= 2) {
                  // Show the first 3 pages and the last page
                  displayedPages = [1, 2, 3, "...", pageCount];
                } else if (activePage >= pageCount - 1) {
                  // Show the first page and the last 3 pages
                  displayedPages = [
                    1,
                    "...",
                    pageCount - 2,
                    pageCount - 1,
                    pageCount,
                  ];
                } else {
                  displayedPages = [
                    activePage - 1,
                    activePage,
                    activePage + 1,
                    "...",
                    pageCount,
                  ];
                }
              }

              return displayedPages.map((page, index) =>
                typeof page === "number" ? (
                  <Button
                    key={page}
                    variant={activePage === page ? "card" : "outline"}
                    size="sm"
                    onClick={() => setActivePage(page)}
                  >
                    {page}
                  </Button>
                ) : (
                  <span key={`ellipsis-${index}`} className="px-2 py-1">
                    {page}
                  </span>
                )
              );
            })()}
          </div>
          {activePage < pageCount && (
            <Button
              variant="card"
              className="w-full md:w-auto rounded-md"
              size="sm"
              onClick={() =>
                setActivePage((prev) => Math.min(prev + 1, pageCount))
              }
              disabled={activePage >= pageCount}
            >
              <ChevronRight />
            </Button>
          )}
        </div>
      </Card>
    </ScrollArea>
  );
};

export default WithdrawalHistoryTable;
