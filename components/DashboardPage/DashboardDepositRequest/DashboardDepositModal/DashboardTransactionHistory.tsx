import TransactionHistoryTable from "@/components/TransactionHistoryPage/TransactionHistoryTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollBar } from "@/components/ui/scroll-area";
import {
  alliance_member_table,
  alliance_referral_link_table,
} from "@prisma/client";
import { DialogTitle } from "@radix-ui/react-dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useState } from "react";

type Props = {
  teamMemberProfile: alliance_member_table;
  referal: alliance_referral_link_table;
  className: string;
};

const DashboardDepositModalRefer = ({
  teamMemberProfile,
  referal,
  className,
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
          className="bg-transparent p-0 shadow-none"
          onClick={() => setOpen(true)}
        >
          Transaction History
        </Button>
      </DialogTrigger>

      <DialogContent
        type="table"
        className="w-[400px] sm:w-[600px] dark:bg-cardColor border-none shadow-none overflow-auto"
      >
        <ScrollArea className="h-[500px] sm:h-full">
          <DialogTitle className="text-2xl font-bold mb-4">
            Transaction History
          </DialogTitle>
          <DialogDescription></DialogDescription>
          <TransactionHistoryTable teamMemberProfile={teamMemberProfile} />
          <DialogFooter className="flex justify-center"></DialogFooter>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardDepositModalRefer;
