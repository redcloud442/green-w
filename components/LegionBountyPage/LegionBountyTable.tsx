"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLegionBounty } from "@/services/Bounty/Member";
import { escapeFormData } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { LegionRequestData } from "@/utils/types";
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
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import TableLoading from "../ui/tableLoading";
import { LegionBountyColumn } from "./LegionBountyColumn";

type DataTableProps = {
  teamMemberProfile: alliance_member_table;
};

type FilterFormValues = {
  emailFilter: string;
};

const LegionBountyTable = ({ teamMemberProfile }: DataTableProps) => {
  const supabaseClient = createClientSide();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [requestData, setRequestData] = useState<LegionRequestData[]>([]);
  const [requestCount, setRequestCount] = useState(0);
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

      const { data, totalCount } = await getLegionBounty({
        teamMemberId: teamMemberProfile.alliance_member_id,
        page: activePage,
        limit: 10,
        columnAccessor: columnAccessor,
        isAscendingSort: isAscendingSort,
        search: emailFilter,
        userId: teamMemberProfile.alliance_member_user_id,
      });

      setRequestData(data || []);
      setRequestCount(totalCount || 0);
    } catch (e) {
    } finally {
      setIsFetchingList(false);
    }
  };

  const columns = LegionBountyColumn();

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
      emailFilter: "",
    },
  });

  useEffect(() => {
    fetchAdminRequest();
  }, [supabaseClient, teamMemberProfile, activePage, sorting]);

  const pageCount = Math.ceil(requestCount / 10);

  const handleFilter = async () => {
    try {
      await fetchAdminRequest();
    } catch (e) {}
  };

  return (
    <ScrollArea className="w-full overflow-x-auto p-2">
      {isFetchingList && <TableLoading />}
      <Card className="w-full p-4">
        <CardHeader className="text-center text-[30px] sm:text-[60px] font-extrabold">
          <CardTitle>NETWORK INCOME</CardTitle>
        </CardHeader>
        <Separator />
        <form
          className="flex gap-2 pt-4 pb-4"
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

        <CardContent className="space-y-4">
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
                    className="h-24 text-center border-r border-black"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <ScrollBar orientation="horizontal" />

          <div className="flex items-center justify-between gap-x-4 py-4">
            {/* <div className="flex justify-between items-center px-2 pt-2">
      <span className="text-sm dark:text-pageColor font-bold ">
        Rows per page
      </span>
      <Select
        defaultValue="10"
        onValueChange={(value) => setLimit(Number(value))}
      >
        <SelectTrigger className="w-[70px] h-8 dark:bg-transparent space-x-2 dark:text-pageColor font-bold border-none border-b-2 shadow-none border-black">
          <SelectValue placeholder="10" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="30">30</SelectItem>
        </SelectContent>
      </Select>
    </div> */}
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
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
};

export default LegionBountyTable;
