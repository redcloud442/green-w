"use client";

import { getLegionBounty } from "@/services/Bounty/Member";
import { escapeFormData } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { LegionRequestData } from "@/utils/types";
import { alliance_member_table } from "@prisma/client";
import {
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ReusableTable from "../ReusableTable/ReusableTable";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { LegionBountyColumn } from "./LegionBountyColumn";

type DataTableProps = {
  teamMemberProfile: alliance_member_table;
  totalNetwork?: number;
};

type FilterFormValues = {
  emailFilter: string;
  dateFilter: {
    start: string;
    end: string;
  };
};

const LegionBountyTable = ({
  teamMemberProfile,
  totalNetwork: initialTotalNetwork,
}: DataTableProps) => {
  const supabaseClient = createClientSide();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [requestData, setRequestData] = useState<LegionRequestData[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [totalNetwork, setTotalNetwork] = useState(initialTotalNetwork || 0);

  const columnAccessor = sorting?.[0]?.id || "user_date_created";
  const isAscendingSort =
    sorting?.[0]?.desc === undefined ? true : !sorting[0].desc;

  const fetchAdminRequest = async () => {
    try {
      if (!teamMemberProfile) return;
      setIsFetchingList(true);

      const sanitizedData = escapeFormData(getValues());

      const { emailFilter, dateFilter } = sanitizedData;

      const { data, totalCount, totalAmount } = await getLegionBounty({
        teamMemberId: teamMemberProfile.alliance_member_id,
        page: activePage,
        limit: 10,
        columnAccessor: columnAccessor,
        isAscendingSort: isAscendingSort,
        search: emailFilter,
        dateFilter: {
          start: dateFilter.start,
          end: dateFilter.end,
        },
      });

      setRequestData(data || []);
      setRequestCount(totalCount || 0);

      if (dateFilter.start && dateFilter.end) {
        setTotalNetwork(totalAmount || 0);
      }
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

  const { register, handleSubmit, getValues, control, watch } =
    useForm<FilterFormValues>({
      defaultValues: {
        emailFilter: "",
        dateFilter: {
          start: undefined,
          end: undefined,
        },
      },
    });

  useEffect(() => {
    fetchAdminRequest();
  }, [supabaseClient, teamMemberProfile, activePage, sorting]);

  const pageCount = Math.ceil(requestCount / 10);
  const { dateFilter } = watch();

  const handleFilter = async () => {
    try {
      await fetchAdminRequest();
    } catch (e) {}
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center text-[30px] sm:text-[60px] font-extrabold">
        <CardTitle>NETWORK INCOME</CardTitle>
      </CardHeader>
      <Separator />

      <CardContent>
        <div className="flex justify-between items-end flex-wrap gap-4">
          <form
            className="flex flex-wrap justify-between gap-2 pt-4 pb-4 w-full items-center"
            onSubmit={handleSubmit(handleFilter)}
          >
            <div className="flex flex-wrap gap-2">
              <Input
                {...register("emailFilter")}
                placeholder="Filter username..."
                className="w-full sm:w-auto"
              />
              <Controller
                name="dateFilter.start"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="font-normal w-full md:w-auto justify-start rounded-md"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(new Date(field.value), "PPP")
                          : "Select Start Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full md:w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date: Date | undefined) =>
                          field.onChange(date?.toISOString() || "")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              <Controller
                name="dateFilter.end"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="font-normal w-full md:w-auto justify-start rounded-md"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(new Date(field.value), "PPP")
                          : "Select End Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full md:w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date: Date | undefined) =>
                          field.onChange(date?.toISOString() || "")
                        }
                        fromDate={
                          dateFilter.start
                            ? new Date(dateFilter.start)
                            : undefined
                        }
                        disabled={(date) =>
                          dateFilter.start
                            ? date < new Date(dateFilter.start)
                            : false
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              <Button
                type="submit"
                disabled={isFetchingList}
                size="sm"
                variant="card"
                className="w-full sm:w-auto"
              >
                <Search />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">
                Total Network Income: ₱{" "}
                {totalNetwork?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </form>
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

export default LegionBountyTable;
