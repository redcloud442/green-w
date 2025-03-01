import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollBar } from "@/components/ui/scroll-area";
import { alliance_member_table } from "@prisma/client";
import { DialogTitle } from "@radix-ui/react-dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useState } from "react";
import ReferalTable from "./ReferalTable";

type Props = {
  teamMemberProfile: alliance_member_table;
};

const ReferralModal = ({ teamMemberProfile }: Props) => {
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
          variant="card"
          className="dark:bg-pageColor dark:text-white h-8 rounded-sm w-full sm:w-auto"
          onClick={() => setOpen(true)}
        >
          My Referrals
        </Button>
      </DialogTrigger>

      <DialogContent
        type="table"
        className="w-[350px] sm:w-[600px] dark:bg-cardColor border-none shadow-none overflow-aut p-0"
      >
        <ScrollArea className="h-[500px] w-full sm:h-full border-2">
          <DialogTitle className=" text-2xl font-bold"></DialogTitle>
          <ReferalTable teamMemberProfile={teamMemberProfile} />
          <DialogFooter className="flex justify-center"></DialogFooter>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralModal;
