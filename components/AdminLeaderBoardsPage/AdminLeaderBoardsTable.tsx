"use client";

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
import { Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "../ui/card";
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
            isFetchingList={isFetchingList}
            setActivePage={setActivePage}
            pageCount={pageCount}
          />
        </TabsContent>

        <TabsContent value="INDIRECT">
          <AdminLeaderBoardsTabTable
            table={table}
            columns={columns}
            activePage={activePage}
            totalCount={totalCount}
            isFetchingList={isFetchingList}
            setActivePage={setActivePage}
            pageCount={pageCount}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AdminLeaderBoardsPage;
