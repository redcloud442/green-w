import { WithdrawalRequestData } from "@/utils/types";
import { ColumnDef, Table as ReactTable } from "@tanstack/react-table";

import { Dispatch, SetStateAction } from "react";
import ReusableTable from "../ReusableTable/ReusableTable";

type Props = {
  table: ReactTable<WithdrawalRequestData>;
  columns: ColumnDef<WithdrawalRequestData>[];
  activePage: number;
  totalCount: number;
  isFetchingList: boolean;
  setActivePage: Dispatch<SetStateAction<number>>;
  pageCount: number;
};

const AdminWithdrawalTabs = ({
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

export default AdminWithdrawalTabs;
