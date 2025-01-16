import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import TableLoading from "@/components/ui/tableLoading";
import { useToast } from "@/hooks/use-toast";
import { DashboardEarnings } from "@/utils/types";
import {
  alliance_member_table,
  alliance_referral_link_table,
} from "@prisma/client";
import { useState } from "react";
import DashboardDirectReferral from "./DashboardDirectReferral";
import DashboardIndirectReferral from "./DashboardIndirectReferral";

type Props = {
  teamMemberProfile: alliance_member_table;
  referal: alliance_referral_link_table;
  className: string;
  isActive: boolean;
  totalEarnings: DashboardEarnings | null;
};

const DashboardDepositModalRefer = ({
  teamMemberProfile,
  referal,
  isActive,
  className,
  totalEarnings,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard!",
        description: "You can now share the link with your connections.",
      });
    });
  };

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
          Refer & Earn
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] dark:bg-transparent p-0 border-none shadow-none">
        {isFetching && <TableLoading />}
        <ScrollArea className="h-[610px] sm:h-full ">
          <DialogDescription></DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold"></DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-end space-y-4">
            {/* Referral Link and Code */}
            {isActive && (
              <Card className="dark:bg-cardColor border-none w-full">
                <CardHeader>
                  <CardTitle className="text-black text-2xl">
                    Refer & Earn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end gap-2">
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="referral_link"
                        className="font-bold dark:text-black"
                      >
                        Referral Link
                      </Label>
                      <Input
                        variant="default"
                        id="referral_link"
                        type="text"
                        readOnly
                        className="text-center"
                        value={referal.alliance_referral_link}
                      />
                    </div>

                    <Button
                      onClick={() =>
                        copyToClipboard(referal.alliance_referral_link)
                      }
                      className="bg-pageColor text-white h-12"
                    >
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="dark:bg-cardColor border-none w-full">
              <CardHeader>
                <CardTitle className="text-black text-xl"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="direct_referrals"
                      className="font-bold dark:text-black"
                    >
                      Direct Bonus Earning
                    </Label>
                    <Input
                      variant="default"
                      id="direct_referrals"
                      readOnly
                      type="text"
                      className="text-center"
                      value={
                        "₱ " +
                        (totalEarnings?.directReferralAmount
                          ? totalEarnings.directReferralAmount.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )
                          : "0.00")
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="multiple_referrals"
                      className="font-bold dark:text-black"
                    >
                      Multiple Bonus Earning
                    </Label>
                    <Input
                      variant="default"
                      id="multiple_referrals"
                      type="text"
                      readOnly
                      className="text-center"
                      value={
                        "₱ " +
                        (totalEarnings?.indirectReferralAmount
                          ? totalEarnings.indirectReferralAmount.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )
                          : "0.00")
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-cardColor border-none w-full">
              <CardHeader>
                <CardTitle className="text-black text-xl"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-around gap-2">
                  <div className="flex flex-col gap-2 items-center justify-center w-24">
                    <Label
                      htmlFor="referrals"
                      className="font-bold dark:text-black text-center"
                    >
                      Direct Referral
                    </Label>
                    <DashboardDirectReferral
                      teamMemberProfile={teamMemberProfile}
                      count={totalEarnings?.directReferralCount || 0}
                    />
                  </div>

                  <div className="flex flex-col gap-2 items-center justify-center w-24">
                    <Label
                      htmlFor="earnings"
                      className="font-bold dark:text-black text-center"
                    >
                      Multiple Referral
                    </Label>
                    <DashboardIndirectReferral
                      teamMemberProfile={teamMemberProfile}
                      count={totalEarnings?.indirectReferralCount || 0}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Earnings */}
          </div>
        </ScrollArea>
        <DialogFooter className="flex justify-center"></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardDepositModalRefer;
