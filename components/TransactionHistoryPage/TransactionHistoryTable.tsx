"use client";

import { logError } from "@/services/Error/ErrorLogs";
import { getTransactionHistory } from "@/services/Transaction/Transaction";
import { formatMonthDateYear, formatTime } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import {
  alliance_member_table,
  alliance_transaction_table,
} from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";

type DataTableProps = {
  teamMemberProfile: alliance_member_table;
};

const TransactionHistoryTable = ({ teamMemberProfile }: DataTableProps) => {
  const supabaseClient = createClientSide();

  const [requestData, setRequestData] = useState<alliance_transaction_table[]>(
    []
  );
  const [requestCount, setRequestCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [isFetchingList, setIsFetchingList] = useState(false);

  const fetchRequest = async () => {
    try {
      if (!teamMemberProfile) return;
      setIsFetchingList(true);

      const { transactionHistory, totalTransactions } =
        await getTransactionHistory({
          page: activePage,
          limit: 10,
        });

      setRequestData(transactionHistory || []);
      setRequestCount(totalTransactions || 0);
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/TopUpHistoryPage/TopUpHistoryTable.tsx",
        });
      }
    } finally {
      setIsFetchingList(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [activePage]);

  const pageCount = Math.ceil(requestCount / 10);

  return isFetchingList ? (
    <Skeleton className="h-[400px] bg-zinc-300 w-full" />
  ) : (
    <ScrollArea className="w-full overflow-x-auto ">
      <Card className="w-full shadow-2xl rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <p className="text-xl text-black sm:text-2xl font-thin">
              Account History
            </p>

            <div className="flex items-center justify-start gap-x-4">
              {activePage > 1 && (
                <Button
                  variant="outline"
                  className="shadow-none"
                  size="sm"
                  onClick={() => setActivePage((prev) => Math.max(prev - 1, 1))}
                  disabled={activePage <= 1}
                >
                  <ChevronLeft />
                </Button>
              )}

              {activePage >= pageCount && (
                <Button
                  variant="outline"
                  className="shadow-none"
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
          </CardTitle>
          <Separator className="my-2 bg-zinc-800" />
        </CardHeader>

        {requestData.map((data, index) => (
          <CardContent
            key={data.transaction_id || `transaction-${index}`}
            className="space-y-4 px-10"
          >
            {/* History Item */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {data.transaction_description.includes("Success") ? (
                  <Image
                    src="/assets/plus.png"
                    alt="success"
                    width={40}
                    height={40}
                  />
                ) : (
                  <Image
                    src="/assets/plus.png"
                    alt="failed"
                    width={40}
                    height={40}
                  />
                )}

                <div>
                  <p className="text-sm sm:text-xl font-medium">
                    {data.transaction_description}
                  </p>
                  <p className="text-[10px] sm:text-[12px] text-gray-500">
                    {data.transaction_description}
                  </p>
                  <p className="text-[10px] sm:text-[12px] text-gray-500">
                    {formatMonthDateYear(data.transaction_date)}{" "}
                    {formatTime(data.transaction_date)}
                  </p>
                </div>
              </div>
              <div
                className={`flex items-center justify-center text-black font-bold text-lg sm:text-3xl ${
                  data.transaction_description.includes("Success")
                    ? "text-green-500"
                    : "text-black"
                }`}
              >
                ₱{" "}
                {data.transaction_amount
                  ? data.transaction_amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "0.00"}
              </div>
            </div>
            <Separator className="bg-zinc-200" />
          </CardContent>
        ))}
      </Card>

      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default TransactionHistoryTable;
