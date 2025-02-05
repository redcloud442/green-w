"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getReferralBounty } from "@/services/Bounty/Member";
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
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
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
    <ScrollArea className="w-full overflow-x-auto ">
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

          <div className="flex items-center justify-between gap-x-4 py-4">
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
              <span className="text-lg font-semibold text-white">
                {activePage}
              </span>

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
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
};

export default ReferalTable;
