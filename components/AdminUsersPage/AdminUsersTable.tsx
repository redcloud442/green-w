"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/services/Error/ErrorLogs";
import {
  getAdminUserRequest,
  handleUpdateRole,
  handleUpdateUserRestriction,
} from "@/services/User/Admin";
import { handleGenerateLink } from "@/services/User/User";
import { escapeFormData, userNameToEmail } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { UserRequestdata } from "@/utils/types";
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
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import TableLoading from "../ui/tableLoading";
import { AdminUsersColumn } from "./AdminUsersColumn";

type DataTableProps = {
  teamMemberProfile: alliance_member_table;
};

type FilterFormValues = {
  usernameFilter: string;
  userRestricted?: string;
  userRole?: string;
  dateCreated?: string;
  bannedUser?: boolean;
};

const AdminUsersTable = ({ teamMemberProfile }: DataTableProps) => {
  const supabaseClient = createClientSide();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [requestData, setRequestData] = useState<UserRequestdata[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const columnAccessor = sorting?.[0]?.id || "user_date_created";
  const isAscendingSort =
    sorting?.[0]?.desc === undefined ? true : !sorting[0].desc;

  const fetchAdminRequest = async () => {
    try {
      if (!teamMemberProfile) return;
      setIsFetchingList(true);

      const sanitizedData = escapeFormData(getValues());

      const { usernameFilter, userRole, dateCreated, bannedUser } =
        sanitizedData;

      const startDate = dateCreated ? new Date(dateCreated) : undefined;
      const { data, totalCount } = await getAdminUserRequest(supabaseClient, {
        page: activePage,
        limit: 10,
        columnAccessor: columnAccessor,
        isAscendingSort: isAscendingSort,
        search: usernameFilter,
        userRole: userRole,
        dateCreated: startDate ? startDate.toISOString() : undefined,
        bannedUser: bannedUser,
      });

      setRequestData(data || []);
      setRequestCount(totalCount || 0);
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/AdminUsersPage/AdminUsersTable.tsx",
        });
      }
    } finally {
      setIsFetchingList(false);
    }
  };

  const handleFilter = async () => {
    try {
      await fetchAdminRequest();
    } catch (e) {}
  };

  const handleCopyAccountUrl = async (userName: string) => {
    try {
      const data = await handleGenerateLink({
        formattedUserName: userNameToEmail(userName),
      });

      navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?hashed_token=${data.url.hashed_token}`
      );

      toast({
        title: "Copied to clipboard",
        description: `You may now access the user's account by accessing the link.`,
      });
    } catch (e) {
      toast({
        title: "Error",
        description:
          e instanceof Error ? e.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const { columns, isOpenModal, setIsOpenModal, setIsLoading, isLoading } =
    AdminUsersColumn(handleCopyAccountUrl);

  const table = useReactTable<UserRequestdata>({
    data: requestData,
    columns: columns,
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

  const { register, handleSubmit, getValues, control, reset } =
    useForm<FilterFormValues>({
      defaultValues: {
        usernameFilter: "",
        userRestricted: "",
        userRole: "",
        dateCreated: "",
        bannedUser: false,
      },
    });

  useEffect(() => {
    fetchAdminRequest();
  }, [supabaseClient, teamMemberProfile, activePage, sorting]);

  const pageCount = Math.ceil(requestCount / 10);

  const handleSwitchChange = (checked: boolean) => {
    setShowFilters(checked);
    if (!checked) {
      reset();
      handleSubmit(handleFilter)();
    }
  };

  const handlePromoteUser = async (memberId: string, role: string) => {
    try {
      setIsLoading(true);
      await handleUpdateRole({ userId: memberId, role });

      fetchAdminRequest();
      setIsOpenModal({ memberId: "", role: "", open: false, type: "" });
      toast({
        title: `Role Updated`,
        description: `Role Updated Sucessfully`,
        variant: "success",
      });
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/AdminUsersPage/AdminUsersTable.tsx",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (memberId: string, type: string) => {
    try {
      setIsLoading(true);
      await handleUpdateUserRestriction({ userId: memberId, type });
      fetchAdminRequest();
      setIsOpenModal({ memberId: "", role: "", open: false, type: "" });

      if (type === "BAN") {
        setRequestData((prev) =>
          prev.map((request) =>
            request.alliance_member_id === memberId
              ? { ...request, alliance_member_is_restricted: true }
              : request
          )
        );
      } else if (type === "UNBAN") {
        setRequestData((prev) =>
          prev.map((request) =>
            request.alliance_member_id === memberId
              ? { ...request, alliance_member_is_restricted: false }
              : request
          )
        );
      }
      toast({
        title: `User ${type === "BAN" ? "Banned" : "Unbanned"}`,
        description: `User ${type === "BAN" ? "Banned" : "Unbanned"} Sucessfully`,
        variant: "success",
      });
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/AdminUsersPage/AdminUsersTable.tsx",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full rounded-sm p-4">
      {isOpenModal && (
        <Dialog
          open={isOpenModal.open}
          onOpenChange={(open) => setIsOpenModal({ ...isOpenModal, open })}
        >
          <DialogDescription></DialogDescription>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Are your sure you want to{" "}
                {isOpenModal.type === "PROMOTE" ? "promote" : "ban"} this user
                to{" "}
                {isOpenModal.role.charAt(0).toUpperCase() +
                  isOpenModal.role.slice(1).toLocaleLowerCase()}{" "}
                ?
              </DialogTitle>
            </DialogHeader>

            <div className="flex justify-end gap-2 mt-4">
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  if (isOpenModal.type === "PROMOTE") {
                    handlePromoteUser(isOpenModal.memberId, isOpenModal.role);
                  } else {
                    handleBanUser(isOpenModal.memberId, isOpenModal.type);
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    {isOpenModal.type === "PROMOTE" ? "Promoting" : "Banning"}{" "}
                    <Loader2 className="animate-spin" />
                  </>
                ) : (
                  "Yes"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <div className="flex flex-wrap items-start py-4">
        <form
          className="flex flex-col gap-6 w-full max-w-3xl"
          onSubmit={handleSubmit(handleFilter)}
        >
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              {...register("usernameFilter")}
              placeholder="Filter by username..."
              className="w-full sm:max-w-sm p-2 border rounded"
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
              onClick={fetchAdminRequest}
              disabled={isFetchingList}
              size="sm"
              variant="card"
              className="w-full md:w-auto rounded-md"
            >
              <RefreshCw className="mr-2" />
              Refresh
            </Button>

            <Switch
              id="filter-switch"
              checked={showFilters}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="filter-switch">Filter</Label>
          </div>

          {showFilters && (
            <div className="flex w-full flex-wrap gap-2 items-center p-2 rounded mb-4">
              <Controller
                name="userRole"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === field.value ? "" : value)
                    }
                    value={field.value || ""}
                  >
                    <SelectTrigger className="w-full sm:w-auto">
                      <SelectValue placeholder="User Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="MERCHANT">Merchant</SelectItem>
                      <SelectItem value="ACCOUNTING">Accounting</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />

              <Controller
                name="dateCreated"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto font-normal justify-start"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(new Date(field.value), "PPP")
                          : "Date Created"}
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
              <Controller
                name="bannedUser"
                control={control}
                render={({ field }) => (
                  <>
                    <Switch
                      id="filter-switch"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="filter-switch">Show Banned User</Label>
                  </>
                )}
              />
              <Button
                variant="card"
                className="w-full md:w-auto rounded-md"
                onClick={fetchAdminRequest}
              >
                Submit
              </Button>
            </div>
          )}
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
      </ScrollArea>

      <div className="flex items-center justify-end gap-x-4 py-4">
        {activePage > 1 && (
          <Button
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
  );
};

export default AdminUsersTable;
