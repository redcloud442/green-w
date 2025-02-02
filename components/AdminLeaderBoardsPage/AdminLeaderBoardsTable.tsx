"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLeaderBoardData } from "@/services/Dasboard/Admin";
import { logError } from "@/services/Error/ErrorLogs";
import { createClientSide } from "@/utils/supabase/client";
import { alliance_member_table } from "@prisma/client";
import {
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "../ui/card";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import TableLoading from "../ui/tableLoading";
import { leaderBoardColumn } from "./AdminLeaderBoardsColumn";
import AdminLeaderBoardsTabTable from "./AdminLeaderBoardsTabTable";

type Props = {
  teamMemberProfile: alliance_member_table;
};

const AdminLeaderBoardsPage = ({ teamMemberProfile }: Props) => {
  const supabaseClient = createClientSide();
  const [leaderboards, setLeaderboards] = useState<
    { username: string; totalAmount: number }[]
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [leaderBoardType, setLeaderBoardType] = useState<"DIRECT" | "INDIRECT">(
    "DIRECT"
  );
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const cachedLeaderboards = useRef<{
    [key: string]: {
      data: { username: string; totalAmount: number }[];
      totalCount: number;
    };
  }>({});

  useEffect(() => {
    const getLeaderboards = async () => {
      try {
        setIsFetchingList(true);
        const cacheKey = `${leaderBoardType}-${activePage}`;
        if (cachedLeaderboards.current[cacheKey]) {
          const cachedData = cachedLeaderboards.current[cacheKey];
          setLeaderboards(cachedData.data);
          setTotalCount(cachedData.totalCount);
          return;
        }

        const { totalCount, data } = await getLeaderBoardData({
          leaderBoardType,
          teamMemberId: teamMemberProfile.alliance_member_id,
          limit: 10,
          page: activePage,
        });

        cachedLeaderboards.current[cacheKey] = { data, totalCount };

        setLeaderboards(data);

        setTotalCount(totalCount);
      } catch (e) {
        if (e instanceof Error) {
          await logError(supabaseClient, {
            errorMessage: e.message,
            stackTrace: e.stack,
            stackPath:
              "components/AdminLeaderBoardsPage/AdminLeaderBoardsTable.tsx",
          });
        }
      } finally {
        setIsFetchingList(false);
      }
    };
    getLeaderboards();
  }, [leaderBoardType, activePage]);

  const columns = leaderBoardColumn(activePage, 10);

  const table = useReactTable({
    data: leaderboards,
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

  const handleTabChange = (type?: string) => {
    setLeaderBoardType(type as "DIRECT" | "INDIRECT");
    setActivePage(1);
  };

  const pageCount = Math.ceil(totalCount / 10);

  return (
    <Card className="w-full rounded-sm p-4">
      <div className="flex items-center py-4">
        <div className="flex items-start py-4">
          <h1 className="Title pr-4 text-2xl font-bold">Leaderboards</h1>
          <Trophy size={40} />
        </div>
      </div>

      <Tabs defaultValue="DIRECT" onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="DIRECT">Direct Referrals</TabsTrigger>
          <TabsTrigger value="INDIRECT">Indirect Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="DIRECT">
          <AdminLeaderBoardsTabTable
            table={table}
            columns={columns}
            activePage={activePage}
            totalCount={totalCount}
          />
        </TabsContent>

        <TabsContent value="INDIRECT">
          <AdminLeaderBoardsTabTable
            table={table}
            columns={columns}
            activePage={activePage}
            totalCount={totalCount}
          />
        </TabsContent>
      </Tabs>
      <ScrollArea className="w-full overflow-x-auto ">
        {isFetchingList && <TableLoading />}
        <Separator />

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

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
                  variant={activePage === page ? "default" : "outline"}
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
            variant="outline"
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

export default AdminLeaderBoardsPage;
