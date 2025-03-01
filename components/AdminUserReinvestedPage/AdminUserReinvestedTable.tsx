"use client";

import { adminUserReinvestedReportData } from "@/utils/types";
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
import { Dispatch, SetStateAction, useState } from "react";
import ReusableTable from "../ReusableTable/ReusableTable";
import { Card } from "../ui/card";
import { AdminUserReinvestedColumn } from "./AdminUserReinvestedColumn";
type DataTableProps = {
  reinvestedReportData: adminUserReinvestedReportData[];
  setActivePage: Dispatch<SetStateAction<number>>;
  activePage: number;
  totalCount: number;
};

const AdminUserReinvestedTable = ({
  reinvestedReportData,
  setActivePage,
  totalCount,
  activePage,
}: DataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columns = AdminUserReinvestedColumn();

  const table = useReactTable({
    data: reinvestedReportData,
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

  const pageCount = Math.ceil(totalCount / 10);

  return (
    <Card className="w-full rounded-sm p-4">
      <ReusableTable
        table={table}
        columns={columns}
        activePage={activePage}
        totalCount={totalCount}
        isFetchingList={false}
        setActivePage={setActivePage}
        pageCount={pageCount}
      />
    </Card>
  );
};

export default AdminUserReinvestedTable;
