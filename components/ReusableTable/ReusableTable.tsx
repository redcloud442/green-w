import {
  ColumnDef,
  flexRender,
  Table as ReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { Button } from "../ui/button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import TableLoading from "../ui/tableLoading";
type Props<T> = {
  table: ReactTable<T>;
  columns: ColumnDef<T>[];
  activePage: number;
  totalCount: number;
  isFetchingList: boolean;
  setActivePage: Dispatch<SetStateAction<number>>;
  pageCount: number;
};

const ReusableTable = <T extends object>({
  table,
  columns,
  activePage,
  totalCount,
  isFetchingList,
  setActivePage,
  pageCount,
}: Props<T>) => {
  return (
    <>
      <ScrollArea className="relative w-full overflow-x-auto">
        {isFetchingList && <TableLoading />}

        <Table className="min-w-full table-auto border-separate border-spacing-0 dark:bg-blue-600 border-white">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-stone-100 dark:bg-stone-600"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="py-2 px-4 text-center text-md font-extrabold text-white border-b border-r bg-blue-500 border-white dark:text-zinc-300 dark:border-zinc-500"
                  >
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
            {table.getExpandedRowModel().rows.length ? (
              table.getExpandedRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="transition-all duration-300 hover:bg-blue-200"
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3 px-4 text-sm text-zinc-700 border-b border-r border-white dark:text-zinc-300 dark:border-zinc-500 hover:bg-blue-300 hover:text-white"
                    >
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
                  className="h-40 text-center text-sm text-zinc-600 dark:text-zinc-300"
                >
                  No data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <tfoot>
            <TableRow>
              <TableCell className="px-0" colSpan={columns.length}>
                <div className="flex justify-between items-center py-2 px-4 border-t border-white bg-blue-500 dark:border-zinc-500">
                  <span className="text-sm text-white">
                    Showing {totalCount} out of {totalCount} entries
                  </span>
                </div>
              </TableCell>
            </TableRow>
          </tfoot>
        </Table>

        <ScrollBar
          className="bg-gray-700 dark:bg-blue-500 "
          orientation="horizontal"
        />
      </ScrollArea>

      <div className="flex items-center justify-end gap-x-4 py-4">
        {activePage > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivePage((prev) => Math.max(prev - 1, 1))}
            disabled={activePage <= 1}
            className="bg-blue-500 text-white rounded-lg px-3 py-2 hover:bg-blue-600 transition dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-white"
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
                  variant={activePage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivePage(page)}
                  className={`${
                    activePage === page
                      ? "bg-blue-500 text-white"
                      : "border border-zinc-300 text-zinc-700 dark:border-zinc-500 dark:text-zinc-300"
                  } rounded-lg px-3 py-2 hover:bg-blue-600 hover:text-white transition`}
                >
                  {page}
                </Button>
              ) : (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-zinc-600 dark:text-zinc-300"
                >
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
            className=" text-white rounded-lg px-3 py-2 bg-blue-500 hover:bg-blue-600 transition dark:hover:bg-blue-500 dark:text-white"
          >
            <ChevronRight />
          </Button>
        )}
      </div>
    </>
  );
};

export default ReusableTable;
