"use client";

import { adminSalesTotalReportData } from "@/utils/types";
import {
  ColumnFiltersState,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";
import ReusableTable from "../ReusableTable/ReusableTable";
import { Card } from "../ui/card";
import { AdminSalesReportColumn } from "./AdminSalesReportColum";

type DataTableProps = {
  salesReportData: adminSalesTotalReportData;
};

const AdminSalesReportTable = ({ salesReportData }: DataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columns = AdminSalesReportColumn();

  const table = useReactTable({
    data: salesReportData.dailyIncome,
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

  return (
    <Card className="w-full rounded-sm p-4">
      <div className="flex flex-wrap items-start justify-between py-4 gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Total Request: </span>
            <span className="text-sm font-bold text-green-500">
              {salesReportData.monthlyCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Total Amount: </span>
            <span className="text-sm font-bold text-green-500">
              ₱{" "}
              {salesReportData.monthlyTotal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      <ReusableTable
        table={table}
        columns={columns}
        activePage={1}
        totalCount={1}
        isFetchingList={false}
        setActivePage={() => {}}
        pageCount={1}
      />
    </Card>
  );
};

export default AdminSalesReportTable;
