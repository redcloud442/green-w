"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logError } from "@/services/Error/ErrorLogs";
import { getAdminWithdrawalTotalReport } from "@/services/Withdrawal/Admin";
import { createClientSide } from "@/utils/supabase/client";
import { adminWithdrawalTotalReportData } from "@/utils/types";
import { alliance_member_table } from "@prisma/client";
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import TableLoading from "../ui/tableLoading";
import { AdminWithdrawalReportColumn } from "./AdminWithdrawalReportColumn";

type DataTableProps = {
  teamMemberProfile: alliance_member_table;
  withdrawalReportData: {
    total_amount: number;
    total_request: number;
  };
};

type FilterFormValues = {
  type: string;
  take: number;
};

const AdminWithdrawalReportTable = ({
  teamMemberProfile,
  withdrawalReportData,
}: DataTableProps) => {
  const supabaseClient = createClientSide();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [requestData, setRequestData] = useState<
    adminWithdrawalTotalReportData[]
  >([]);
  const [isFetchingList, setIsFetchingList] = useState(false);

  const columns = AdminWithdrawalReportColumn();

  const table = useReactTable({
    data: requestData,
    columns: columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getExpandedRowModel: getExpandedRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const { register, handleSubmit, getValues, setValue } =
    useForm<FilterFormValues>({
      defaultValues: {
        type: "WEEKLY",
        take: 10,
      },
    });

  const handleFetchTotalWithdrawalReport = async () => {
    try {
      const { take, type } = getValues();

      setIsFetchingList(true);
      let skip = 0;
      const fetchedData: adminWithdrawalTotalReportData[] = [];

      while (fetchedData.length < take) {
        const batchSize = Math.min(10, take - fetchedData.length); // Adjust batch size to fit the remaining data

        const data = await getAdminWithdrawalTotalReport({
          type: type,
          skip: skip,
          take: batchSize,
        });

        if (data.length === 0) break; // Stop fetching if no more data is returned
        fetchedData.push(...data);
        skip += batchSize;
      }

      setRequestData(fetchedData);
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/AdminWithdrawalReportTable",
        });
      }
    } finally {
      setIsFetchingList(false);
    }
  };

  useEffect(() => {
    handleFetchTotalWithdrawalReport();
  }, []); // Fetch new data whenever the type or take value changes

  return (
    <Card className="w-full rounded-sm p-4">
      <div className="flex flex-wrap items-start justify-between py-4 gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Total Request: </span>
            <span className="text-sm font-bold text-green-500">
              {withdrawalReportData.total_request}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Total Amount: </span>
            <span className="text-sm font-bold text-green-500">
              ₱{" "}
              {withdrawalReportData.total_amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={handleSubmit(handleFetchTotalWithdrawalReport)}
        >
          <Select
            onValueChange={(value) => {
              setValue("type", value);
            }}
          >
            <SelectTrigger className="w-[180px] flex-1">
              <SelectValue placeholder={`${getValues("type")}`} />
            </SelectTrigger>

            <SelectContent {...register("type")}>
              <SelectItem value="WEEKLY">WEEKLY</SelectItem>
              {/* <SelectItem value="MONTHLY">MONTHLY</SelectItem> */}
              <SelectItem value="DAILY">DAILY</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              setValue("take", Number(value));
            }}
          >
            <SelectTrigger className="w-[100px] flex-1">
              <SelectValue placeholder={`${getValues("take")}`} />
            </SelectTrigger>

            <SelectContent {...register("take")}>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
            </SelectContent>
          </Select>
          <Button className="flex-1 rounded-md" variant={"card"} type="submit">
            Submit
          </Button>
        </form>
      </div>

      <ScrollArea className="w-full overflow-x-auto ">
        {isFetchingList && <TableLoading />}
        <Separator />
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
            {table.getExpandedRowModel().rows.length ? (
              table.getExpandedRowModel().rows.map((row) => (
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
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
};

export default AdminWithdrawalReportTable;
