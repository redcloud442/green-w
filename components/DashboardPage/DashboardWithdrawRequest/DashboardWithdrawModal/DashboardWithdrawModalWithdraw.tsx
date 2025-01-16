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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getEarnings } from "@/services/User/User";
import {
  alliance_earnings_table,
  alliance_member_table,
  alliance_preferred_withdrawal_table,
  user_table,
} from "@prisma/client";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import DashboardAddUserPreferredBank from "./DashboardAddUserPreferredBank";
import DashboardWithdrawalModalForm from "./DashboardWithdrawalModalForm";

type Props = {
  teamMemberProfile: alliance_member_table;
  earnings: alliance_earnings_table | null;
  setEarnings: Dispatch<SetStateAction<alliance_earnings_table | null>>;
  profile: user_table;
};

const DashboardWithdrawModalWithdraw = ({
  teamMemberProfile,
  earnings,
  setEarnings,
  profile,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [preferredEarnings, setPreferredEarnings] =
    useState<alliance_preferred_withdrawal_table | null>(null);
  const [preferredType, setPreferredType] = useState<string | null>(null);
  const [preferredWithdrawalList, setPreferredWithdrawalList] = useState<
    alliance_preferred_withdrawal_table[]
  >([]);
  const { toast } = useToast();

  const fetchEarnings = async () => {
    try {
      if (!open) return;
      const { earnings, preferredWithdrawal } = await getEarnings();
      setEarnings(earnings);
      setPreferredWithdrawalList(preferredWithdrawal);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="bg-transparent p-0 shadow-none h-full flex flex-col items-center justify-center"
          onClick={() => setOpen(true)}
        >
          <Image
            src="/assets/withdraw.png"
            alt="withdraw"
            width={240}
            height={240}
          />
          <p className="text-sm sm:text-lg font-thin absolute bottom-1/4">
            WITHDRAW
          </p>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-xl">
        <ScrollArea className="w-full relative sm:max-w-[400px] h-[600px] sm:h-full">
          <DialogHeader className="text-start text-2xl font-bold">
            <DialogTitle className="text-2xl font-bold mb-4">
              Withdraw
            </DialogTitle>
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
              setEarnings={setEarnings}
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
