import { ColumnDef, Table as ReactTable } from "@tanstack/react-table";
import { Dispatch, SetStateAction } from "react";
import ReusableTable from "../ReusableTable/ReusableTable";

type LeaderboardData = {
  username: string;
  totalAmount: number;
  totalReferral: number;
};

type Props = {
  table: ReactTable<LeaderboardData>;
  columns: ColumnDef<LeaderboardData>[];
  activePage: number;
  totalCount: number;
  isFetchingList: boolean;
  setActivePage: Dispatch<SetStateAction<number>>;
  pageCount: number;
};

const AdminLeaderBoardsTabTable = ({
  table,
  columns,
  activePage,
  totalCount,
  isFetchingList,
  setActivePage,
  pageCount,
}: Props) => {
  return (
    <ReusableTable
      table={table}
      columns={columns}
      activePage={activePage}
      totalCount={totalCount}
      isFetchingList={isFetchingList}
      setActivePage={setActivePage}
      pageCount={pageCount}
    />
  );
};

export default AdminLeaderBoardsTabTable;
