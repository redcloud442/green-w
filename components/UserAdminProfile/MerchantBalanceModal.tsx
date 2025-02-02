import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollBar } from "@/components/ui/scroll-area";
import { UserRequestdata } from "@/utils/types";
import { merchant_balance_log } from "@prisma/client";
import { DialogTitle } from "@radix-ui/react-dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Dispatch, SetStateAction, useState } from "react";
import MerchantBalanceTable from "./MerchantBalanceTable";

type Props = {
  userProfile: UserRequestdata;
  merchantBalanceHistory: {
    data: merchant_balance_log[];
    count: number;
  };
  cache: React.MutableRefObject<
    Record<number, { data: merchant_balance_log[]; count: number }>
  >;
  setMerchantBalanceHistory: Dispatch<
    SetStateAction<{
      data: merchant_balance_log[];
      count: number;
    }>
  >;
};

const MerchantBalanceModal = ({
  cache,
  userProfile,
  merchantBalanceHistory,
  setMerchantBalanceHistory,
}: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          className=" w-full"
          variant={"card"}
          onClick={() => setOpen(true)}
        >
          History
        </Button>
      </DialogTrigger>

      <DialogContent
        type="table"
        className="w-[400px] sm:w-[600px] dark:bg-cardColor border-none shadow-none overflow-auto"
      >
        <ScrollArea className="h-[500px] sm:h-full">
          <DialogTitle className="text-2xl font-bold mb-4">
            Merchant Balance History
          </DialogTitle>
          <DialogDescription></DialogDescription>
          <MerchantBalanceTable
            cache={cache}
            merchantBalanceHistory={merchantBalanceHistory}
            setMerchantBalanceHistory={setMerchantBalanceHistory}
            userProfile={userProfile}
          />
          <DialogFooter className="flex justify-center"></DialogFooter>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MerchantBalanceModal;
