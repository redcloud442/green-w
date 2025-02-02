"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TableLoading from "@/components/ui/tableLoading";
import { logError } from "@/services/Error/ErrorLogs";
import { getMerchantBalanceHistory } from "@/services/merchant/Merchant";
import { createClientSide } from "@/utils/supabase/client";
import { UserRequestdata } from "@/utils/types";
import { merchant_balance_log } from "@prisma/client";
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { MerchantBalanceColumn } from "./MerchantBalanceColumn";

type DataTableProps = {
  userProfile: UserRequestdata;
  cache: React.MutableRefObject<
    Record<number, { data: merchant_balance_log[]; count: number }>
  >;
  merchantBalanceHistory: {
    data: merchant_balance_log[];
    count: number;
  };
  setMerchantBalanceHistory: Dispatch<
    SetStateAction<{
      data: merchant_balance_log[];
      count: number;
    }>
  >;
};

const MerchantBalanceTable = ({
  cache,
  userProfile,
  merchantBalanceHistory,
  setMerchantBalanceHistory,
}: DataTableProps) => {
  const supabaseClient = createClientSide();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [activePage, setActivePage] = useState(1);
  const [isFetchingList, setIsFetchingList] = useState(false);

  const fetchRequest = async () => {
    try {
      if (!userProfile) return;

      if (cache.current[activePage]) {
        setMerchantBalanceHistory(cache.current[activePage]);
        return;
      }

      setIsFetchingList(true);
      const data = await getMerchantBalanceHistory({
        page: activePage,
        limit: 10,
      });

      const result = {
        data: data.data,
        count: data.totalCount,
      };

      cache.current[activePage] = result;

      setMerchantBalanceHistory(result);
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath:
            "components/UserAdminProfile/MerchantBalanceModal/MerchantBalanceTable.tsx",
        });
      }
    } finally {
      setIsFetchingList(false);
    }
  };

  const columns = MerchantBalanceColumn();

  const table = useReactTable({
    data: merchantBalanceHistory.data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  useEffect(() => {
    fetchRequest();
  }, [activePage]);

  const pageCount = Math.ceil(merchantBalanceHistory.count / 10);

  return (
    <ScrollArea className="w-full overflow-x-auto ">
      {isFetchingList && <TableLoading />}

      <Table className="w-full border-collapse border border-black font-bold">
        <TableHeader className="border-b border-black dark:text-pageColor font-bold">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-black  dark:text-pageColor font-bold"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  className="border-r border-black px-4 py-2 dark:text-pageColor hover:bg-transparent font-bold"
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
                    className="border-r border-black px-4 py-2"
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
        <div className="flex items-center justify-start gap-x-4">
          {/* Left Arrow */}
          <Button
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
    </ScrollArea>
  );
};

export default MerchantBalanceTable;
