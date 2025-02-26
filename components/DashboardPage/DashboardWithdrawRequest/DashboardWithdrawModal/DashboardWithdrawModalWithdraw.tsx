import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getPreferredWithdrawal } from "@/services/Withdrawal/Member";
import { useUserHaveAlreadyWithdraw } from "@/store/userHaveAlreadyWithdraw";
import {
  alliance_earnings_table,
  alliance_member_table,
  alliance_preferred_withdrawal_table,
  user_table,
} from "@prisma/client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import DashboardAddUserPreferredBank from "./DashboardAddUserPreferredBank";
import DashboardWithdrawalModalForm from "./DashboardWithdrawalModalForm";

type Props = {
  teamMemberProfile: alliance_member_table;
  earnings: alliance_earnings_table | null;
  profile: user_table;
};

const DashboardWithdrawModalWithdraw = ({
  teamMemberProfile,
  earnings,
  profile,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [preferredEarnings, setPreferredEarnings] =
    useState<alliance_preferred_withdrawal_table | null>(null);
  const [preferredType, setPreferredType] = useState<string | null>(null);
  const [preferredWithdrawalList, setPreferredWithdrawalList] = useState<
    alliance_preferred_withdrawal_table[]
  >([]);
  const [isFetching, setIsFetching] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isWithdrawalToday } = useUserHaveAlreadyWithdraw();

  const fetchEarnings = async () => {
    try {
      if (!open || preferredWithdrawalList.length > 0 || modalRef.current)
        return;
      setIsFetching(true);

      const preferredWithdrawal = await getPreferredWithdrawal();

      setPreferredWithdrawalList(preferredWithdrawal);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setPreferredEarnings(null);
          setPreferredType(null);
        }
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        {!isWithdrawalToday.package || !isWithdrawalToday.referral ? (
          <Button
            className="bg-transparent p-0 shadow-none h-full flex flex-col items-center justify-center"
            onClick={() => setOpen(true)}
          >
            <Image
              src="/assets/withdraw.ico"
              alt="plans"
              width={35}
              height={35}
            />
            <p className="text-sm sm:text-lg font-thin ">WITHDRAW</p>
          </Button>
        ) : (
          <Popover>
            <PopoverTrigger className="bg-transparent pt-0 shadow-none h-full flex flex-col items-center justify-center">
              <Image
                src="/assets/withdraw.ico"
                alt="plans"
                width={35}
                height={35}
              />
              <p className="text-sm sm:text-lg font-thin pt-2">WITHDRAW</p>
            </PopoverTrigger>
            <PopoverContent>
              You have already made a withdrawal today, Please try again
              tomorrow.
            </PopoverContent>
          </Popover>
        )}
      </DialogTrigger>

      <DialogContent ref={modalRef}>
        <ScrollArea className=" w-full  sm:max-w-full h-[600px] sm:h-full">
          <DialogHeader className="text-start text-2xl font-bold">
            <DialogTitle className="text-3xl font-bold text-center">
              Withdraw
            </DialogTitle>
            <Separator />
            <DialogDescription></DialogDescription>
          </DialogHeader>

          {preferredEarnings === null && preferredType === null && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-around">
                <div
                  onClick={() => setPreferredType("bank")}
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <p className="text-2xl font-extrabold">BANK</p>
                  <Image
                    src="/assets/bank.png"
                    alt="bank"
                    width={100}
                    height={100}
                  />
                </div>

                <div
                  onClick={() => setPreferredType("ewallet")}
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer "
                >
                  <p className="text-2xl font-extrabold">E-WALLET</p>
                  <Image
                    src="/assets/payment.png"
                    alt="payment"
                    width={100}
                    height={100}
                  />
                </div>
              </div>

              <DashboardAddUserPreferredBank
                isFetching={isFetching}
                preferredWithdrawalList={preferredWithdrawalList}
                setPreferredEarnings={setPreferredEarnings}
                setPreferredWithdrawalList={setPreferredWithdrawalList}
              />
            </div>
          )}

          {(preferredEarnings || preferredType) && (
            <DashboardWithdrawalModalForm
              profile={profile}
              teamMemberProfile={teamMemberProfile}
              earnings={earnings}
              setOpen={setOpen}
              preferredEarnings={preferredEarnings ?? null}
              preferredType={preferredType ?? null}
            />
          )}
          <DialogFooter></DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardWithdrawModalWithdraw;
