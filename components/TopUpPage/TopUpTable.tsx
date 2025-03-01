"use client";

import { logError } from "@/services/Error/ErrorLogs";
import { getAdminTopUpRequest } from "@/services/TopUp/Admin";
import { escapeFormData } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { AdminTopUpRequestData } from "@/utils/types";
import { alliance_member_table } from "@prisma/client";
import { DialogDescription } from "@radix-ui/react-dialog";
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
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PhilippinePeso,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card } from "../ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { TopUpColumn } from "./TopUpColumn";
import TopUpTabs from "./TopUpTabs";

type DataTableProps = {
  teamMemberProfile: alliance_member_table;
};

type FilterFormValues = {
  referenceId: string;
  userFilter: string;
  statusFilter: string;
  rejectNote: string;
  dateFilter: { start: string; end: string };
};

const TopUpTable = ({ teamMemberProfile }: DataTableProps) => {
  const supabaseClient = createClientSide();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [requestData, setRequestData] = useState<AdminTopUpRequestData | null>(
    null
  );
  const [activePage, setActivePage] = useState(1);
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const columnAccessor = sorting?.[0]?.id || "alliance_top_up_request_date";
  const isAscendingSort =
    sorting?.[0]?.desc === undefined ? true : !sorting[0].desc;

  const fetchRequest = async () => {
    try {
      if (!teamMemberProfile) return;
      setIsFetchingList(true);

      const sanitizedData = escapeFormData(getValues());

      const { referenceId, userFilter, statusFilter, dateFilter } =
        sanitizedData;
      const startDate = dateFilter.start
        ? new Date(dateFilter.start)
        : undefined;
      const endDate = startDate ? new Date(startDate) : undefined;
      const requestData = await getAdminTopUpRequest({
        page: activePage,
        limit: 10,
        columnAccessor: columnAccessor,
        isAscendingSort: isAscendingSort,
        search: referenceId,
        userFilter,
        statusFilter: statusFilter ?? "PENDING",
        dateFilter: {
          start:
            startDate && !isNaN(startDate.getTime())
              ? startDate.toISOString()
              : undefined,
          end:
            endDate && !isNaN(endDate.getTime())
              ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString()
              : undefined,
        },
      });

      setRequestData((prev: AdminTopUpRequestData | null) => {
        if (!prev) {
          return {
            data: {
              APPROVED: {
                data: [],
                count: requestData?.data?.APPROVED?.count || 0,
              },
              REJECTED: {
                data: [],
                count: requestData?.data?.REJECTED?.count || 0,
              },
              PENDING: {
                data: [],
                count: requestData?.data?.PENDING?.count || 0,
              },
              [statusFilter as "PENDING" | "APPROVED" | "REJECTED"]: requestData
                ?.data?.[
                statusFilter as "PENDING" | "APPROVED" | "REJECTED"
              ] || {
                data: [],
                count: 0,
              },
            },
            merchantBalance: requestData?.merchantBalance || 0,
          };
        }

        return {
          ...prev,
          data: {
            ...prev.data,
            [statusFilter as "PENDING" | "APPROVED" | "REJECTED"]: requestData
              ?.data?.[statusFilter as "PENDING" | "APPROVED" | "REJECTED"] || {
              data: [],
              count: 0,
            },
          },
        };
      });
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/TopUpPage/TopUpTable.tsx",
        });
      }
    } finally {
      setIsFetchingList(false);
    }
  };

  const handleFilter = async () => {
    try {
      await handleRefresh();
    } catch (e) {}
  };

  const handleRefresh = async () => {
    try {
      setIsFetchingList(true);

      const statuses: Array<"PENDING" | "APPROVED" | "REJECTED"> = [
        "PENDING",
        "APPROVED",
        "REJECTED",
      ];

      const updatedData: AdminTopUpRequestData = {
        data: {
          APPROVED: { data: [], count: 0 },
          REJECTED: { data: [], count: 0 },
          PENDING: { data: [], count: 0 },
        },
        merchantBalance: 0,
      };

      const sanitizedData = escapeFormData(getValues());

      const { referenceId, userFilter, statusFilter, dateFilter } =
        sanitizedData;
      const startDate = dateFilter.start
        ? new Date(dateFilter.start)
        : undefined;
      const endDate = startDate ? new Date(startDate) : undefined;

      const requestData = await getAdminTopUpRequest({
        page: activePage,
        limit: 10,
        columnAccessor: columnAccessor,
        isAscendingSort: isAscendingSort,
        search: referenceId,
        userFilter,
        statusFilter: statusFilter ?? "PENDING",
        dateFilter: {
          start:
            startDate && !isNaN(startDate.getTime())
              ? startDate.toISOString()
              : undefined,
          end:
            endDate && !isNaN(endDate.getTime())
              ? new Date(endDate.setHours(23, 59, 59, 999)).toISOString()
              : undefined,
        },
      });

      for (const status of statuses) {
        updatedData.data[status] = requestData?.data?.[status] || {
          data: [],
          count: 0,
        };
      }

      updatedData.merchantBalance = requestData?.merchantBalance || 0;

      setRequestData(updatedData);
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/TopUpPage/TopUpTable.tsx",
        });
      }
    } finally {
      setIsFetchingList(false); // Reset loading state
    }
  };

  const { register, handleSubmit, watch, getValues, control, reset, setValue } =
    useForm<FilterFormValues>({
      defaultValues: {
        referenceId: "",
        userFilter: "",
        statusFilter: "PENDING",
        dateFilter: {
          start: undefined,
          end: undefined,
        },
        rejectNote: "",
      },
    });

  const {
    columns,
    isOpenModal,
    isLoading,
    setIsOpenModal,
    handleUpdateStatus,
  } = TopUpColumn(setRequestData, reset);
  const status = watch("statusFilter") as "PENDING" | "APPROVED" | "REJECTED";

  const table = useReactTable({
    data: requestData?.data?.[status]?.data || [],
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

  useEffect(() => {
    fetchRequest();
  }, [supabaseClient, teamMemberProfile, activePage, sorting]);

  const pageCount = Math.ceil((requestData?.data?.[status]?.count || 0) / 10);

  const handleSwitchChange = (checked: boolean) => {
    setShowFilters(checked);
    if (!checked) {
      reset();
      handleRefresh();
    }
  };

  const handleTabChange = async (type?: string) => {
    setValue("statusFilter", type as "PENDING" | "APPROVED" | "REJECTED");
    if (
      requestData?.data?.[type as "PENDING" | "APPROVED" | "REJECTED"]?.data
        ?.length
    ) {
      return;
    }

    await fetchRequest();
  };

  const rejectNote = watch("rejectNote");
  return (
    <Card className="w-full rounded-sm p-4">
      <div className="flex flex-wrap gap-4 items-start py-4">
        <form
          className="flex flex-col gap-6 w-full max-w-4xl rounded-md"
          onSubmit={handleSubmit(handleFilter)}
        >
          {isOpenModal && (
            <Dialog
              open={isOpenModal.open}
              onOpenChange={(open) => {
                setIsOpenModal({ ...isOpenModal, open });
                if (!open) {
                  reset();
                  setIsOpenModal({
                    status: "",
                    requestId: "",
                    open: false,
                    amount: 0,
                  });
                }
              }}
            >
              <DialogDescription></DialogDescription>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isOpenModal.status.charAt(0).toUpperCase() +
                      isOpenModal.status.slice(1).toLocaleLowerCase()}{" "}
                    This Request
                  </DialogTitle>
                </DialogHeader>
                {isOpenModal.status === "REJECTED" && (
                  <Controller
                    name="rejectNote"
                    control={control}
                    rules={{ required: "Rejection note is required" }}
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col gap-2">
                        <Textarea
                          placeholder="Enter the reason for rejection..."
                          {...field}
                        />
                        {fieldState.error && (
                          <span className="text-red-500 text-sm">
                            {fieldState.error.message}
                          </span>
                        )}
                      </div>
                    )}
                  />
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button
                    disabled={isLoading}
                    onClick={() =>
                      handleUpdateStatus(
                        isOpenModal.status,
                        isOpenModal.requestId,
                        rejectNote
                      )
                    }
                  >
                    {isLoading ? (
                      <>
                        {isOpenModal.status.charAt(0).toUpperCase() +
                          isOpenModal.status.slice(1).toLocaleLowerCase()}{" "}
                        <Loader2 className="animate-spin" />
                      </>
                    ) : isOpenModal.status === "REJECTED" ? (
                      "Confirm Reject"
                    ) : (
                      "Confirm Approve"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <div className="flex flex-wrap gap-2 items-center w-full">
            <Input
              {...register("referenceId")}
              placeholder="Filter requestor username..."
              className="max-w-sm p-2 border rounded"
            />
            <Button
              type="submit"
              disabled={isFetchingList}
              size="sm"
              variant="card"
              className=" rounded-md"
            >
              <Search />
            </Button>
            <Button
              variant="card"
              className=" rounded-md"
              onClick={handleRefresh}
              disabled={isFetchingList}
              size="sm"
            >
              <RefreshCw />
              Refresh
            </Button>
            <div className="flex items-center space-x-2">
              <Switch
                id="filter-switch"
                checked={showFilters}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="filter">Filter</Label>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 items-center rounded-md ">
              <Controller
                name="dateFilter.start"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="font-normal justify-start"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(new Date(field.value), "PPP")
                          : "Select Start Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
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

              <Button type="submit" onClick={handleRefresh}>
                Submit
              </Button>
            </div>
          )}
        </form>
        <div className="flex justify-start gap-2  w-full">
          <div className="flex text-lg font-bold gap-2 items-center">
            Merchant Balance: <PhilippinePeso size={16} />
            {requestData?.merchantBalance?.toLocaleString()}
          </div>
        </div>
      </div>

      <Tabs defaultValue="PENDING" onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="PENDING">
            Pending ({requestData?.data?.PENDING?.count || 0})
          </TabsTrigger>
          <TabsTrigger value="APPROVED">
            Approved ({requestData?.data?.APPROVED?.count || 0})
          </TabsTrigger>
          <TabsTrigger value="REJECTED">
            Rejected ({requestData?.data?.REJECTED?.count || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="PENDING">
          <TopUpTabs
            table={table}
            columns={columns}
            activePage={activePage}
            totalCount={requestData?.data?.PENDING?.count || 0}
            isFetchingList={isFetchingList}
            setActivePage={setActivePage}
            pageCount={pageCount}
          />
        </TabsContent>

        <TabsContent value="APPROVED">
          <TopUpTabs
            table={table}
            columns={columns}
            activePage={activePage}
            totalCount={requestData?.data?.APPROVED?.count || 0}
            isFetchingList={isFetchingList}
            setActivePage={setActivePage}
            pageCount={pageCount}
          />
        </TabsContent>

        <TabsContent value="REJECTED">
          <TopUpTabs
            table={table}
            columns={columns}
            activePage={activePage}
            totalCount={requestData?.data?.REJECTED?.count || 0}
            isFetchingList={isFetchingList}
            setActivePage={setActivePage}
            pageCount={pageCount}
          />
        </TabsContent>
      </Tabs>

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
              displayedPages = pages;
            } else {
              if (activePage <= 2) {
                displayedPages = [1, 2, 3, "...", pageCount];
              } else if (activePage >= pageCount - 1) {
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
            className="md:w-auto rounded-md"
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
  );
};

export default TopUpTable;
