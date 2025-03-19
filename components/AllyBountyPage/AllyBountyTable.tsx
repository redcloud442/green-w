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
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ReferralModal from "../ReferralModal/ReferralModal";
import ReusableTable from "../ReusableTable/ReusableTable";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { AllyBountyColumn } from "./AllyBountyColum";
type DataTableProps = {
  teamMemberProfile: alliance_member_table;
  totalDirectReferral: number;
  totalDirectReferralCount: number;
};

type FilterFormValues = {
  emailFilter: string;
  dateFilter: {
    start: string;
    end: string;
  };
};

const AllyBountyTable = ({
  teamMemberProfile,
  totalDirectReferral,
  totalDirectReferralCount,
}: DataTableProps) => {
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

      const { emailFilter, dateFilter } = sanitizedData;

      const { data, totalCount } = await getAllyBounty({
        page: activePage,
        limit: 10,
        columnAccessor: columnAccessor,
        isAscendingSort: isAscendingSort,
        search: emailFilter,
        dateFilter: dateFilter,
      });

      setRequestData(data || []);
      setRequestCount(totalCount || 0);
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

  const { getValues, handleSubmit, register, control, watch } =
    useForm<FilterFormValues>({
      defaultValues: {
        emailFilter: "",
        dateFilter: {
          start: "",
          end: "",
        },
      },
    });

  const dateFilter = watch("dateFilter");

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
            className="flex flex-wrap gap-2 pt-4 w-full sm:w-auto"
            onSubmit={handleSubmit(handleFilter)}
          >
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
                      selected={field.value ? new Date(field.value) : undefined}
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
                      selected={field.value ? new Date(field.value) : undefined}
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
          </form>
        </div>

        <ReferralModal teamMemberProfile={teamMemberProfile} />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold ">
            Total Referral Count: {totalDirectReferralCount}
          </span>
          <span className="text-sm font-bold ">
            Total Referral Amount: ₱
            {totalDirectReferral.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
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
