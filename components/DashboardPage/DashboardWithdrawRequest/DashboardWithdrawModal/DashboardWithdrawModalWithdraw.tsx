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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/services/Error/ErrorLogs";
import { getEarnings } from "@/services/User/User";
import { createWithdrawalRequest } from "@/services/Withdrawal/Member";
import { calculateFinalAmount, escapeFormData } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { alliance_earnings_table, alliance_member_table } from "@prisma/client";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

type Props = {
  teamMemberProfile: alliance_member_table;
  earnings: alliance_earnings_table | null;
  setEarnings: Dispatch<SetStateAction<alliance_earnings_table | null>>;
};

const withdrawalFormSchema = z.object({
  earnings: z.string(),
  amount: z
    .string()
    .min(3, "Minimum amount is required atleast 200 pesos")
    .refine((amount) => parseInt(amount, 10) > 200, {
      message: "Amount must be at least 200 pesos",
    }),
  bank: z.string().min(1, "Please select a bank"),
  accountName: z
    .string()
    .min(6, "Account name is required")
    .max(40, "Account name must be at most 24 characters"),
  accountNumber: z
    .string()
    .min(6, "Account number is required")
    .max(24, "Account number must be at most 24 digits"),
});

export type WithdrawalFormValues = z.infer<typeof withdrawalFormSchema>;

const bankData = ["GCASH", "MAYA", "GOTYME BANK", "UNION BANK", "BDO", "BPI"];

const DashboardWithdrawModalWithdraw = ({
  teamMemberProfile,
  earnings,
  setEarnings,
}: Props) => {
  const [open, setOpen] = useState(false);
  const totalEarnings =
    (earnings?.alliance_olympus_earnings ?? 0) +
    (earnings?.alliance_referral_bounty ?? 0);

  const supabase = createClientSide();
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WithdrawalFormValues>({
    mode: "onChange",
    resolver: zodResolver(withdrawalFormSchema),
    defaultValues: {
      earnings: "",
      amount: "",
      bank: "",
      accountName: "",
      accountNumber: "",
    },
  });

  const selectedEarnings = useWatch({ control, name: "earnings" });
  const amount = watch("amount");

  const fetchEarnings = async () => {
    try {
      if (!open) return;
      const earnings = await getEarnings();
      setEarnings(earnings);
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

  const getMaxAmount = () => {
    switch (selectedEarnings) {
      case "TOTAL":
        return totalEarnings;
      default:
        return 0;
    }
  };

  const handleWithdrawalRequest = async (data: WithdrawalFormValues) => {
    try {
      const sanitizedData = escapeFormData(data);

      await createWithdrawalRequest({
        WithdrawFormValues: sanitizedData,
        teamMemberId: teamMemberProfile.alliance_member_id,
      });

      switch (selectedEarnings) {
        case "TOTAL":
          if (earnings) {
            // Remaining amount to be deducted
            let remainingAmount = Number(sanitizedData.amount);

            // Calculate Olympus Earnings deduction
            const olympusDeduction = Math.min(
              remainingAmount,
              earnings.alliance_olympus_earnings
            );
            remainingAmount -= olympusDeduction;

            // Calculate Referral Bounty deduction
            const referralDeduction = Math.min(
              remainingAmount,
              earnings.alliance_referral_bounty
            );
            remainingAmount -= referralDeduction;

            // Ensure no remaining amount (sanity check)
            if (remainingAmount > 0) {
              console.error("Insufficient funds to update state.");
              break;
            }

            // Update state with new earnings values
            setEarnings({
              ...earnings,
              alliance_combined_earnings:
                earnings.alliance_combined_earnings -
                Number(sanitizedData.amount),
              alliance_olympus_earnings:
                earnings.alliance_olympus_earnings - olympusDeduction,
              alliance_referral_bounty:
                earnings.alliance_referral_bounty - referralDeduction,
            });
          }
          break;

        default:
          break;
      }

      toast({
        title: "Withdrawal Request Successfully",
        description: "Please wait for it to be approved",
      });

      reset();
      setOpen(false);
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabase, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath:
            "components/DashboardPage/DashboardWithdrawRequest/DashboardWithdrawModal/DashboardWithdrawModalWithdraw.tsx",
        });
      }
      const errorMessage =
        e instanceof Error ? e.message : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          reset();
        }
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

      <DialogContent className="w-full sm:max-w-[400px]">
        <ScrollArea className="w-full relative sm:max-w-[400px] h-[600px] sm:h-full">
          <DialogHeader className="text-start text-2xl font-bold">
            <DialogTitle className="text-2xl font-bold mb-4">
              Withdraw
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(handleWithdrawalRequest)}
            className="space-y-4 mx-auto"
          >
            {/* Earnings Select */}
            <div>
              <Label htmlFor="earnings">Your Available Balance</Label>
              <Controller
                name="earnings"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "TOTAL") {
                        setValue("amount", totalEarnings.toFixed(2));
                      }
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Available Balance">
                        {" "}
                        {field.value === "TOTAL"
                          ? `₱ ${totalEarnings.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : ""}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="text-xs" value="TOTAL">
                        Balance ( ₱{" "}
                        {earnings?.alliance_olympus_earnings.toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}{" "}
                        Package + ₱{" "}
                        {earnings?.alliance_referral_bounty.toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}{" "}
                        Referral ) ={" "}
                        {totalEarnings.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.earnings && (
                <p className="text-primaryRed text-sm mt-1">
                  {errors.earnings.message}
                </p>
              )}
            </div>

            {/* Bank Type Select */}
            <div>
              <Label htmlFor="bank">Select Your Bank</Label>
              <Controller
                name="bank"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankData.map((bank, index) => (
                        <SelectItem key={index} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.bank && (
                <p className="text-primaryRed text-sm mt-1">
                  {errors.bank.message}
                </p>
              )}
            </div>

            <div className="flex flex-col w-full space-y-2 ">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex items-center justify-between w-full gap-2">
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      id="amount"
                      className="w-full flex-grow"
                      placeholder="Enter amount"
                      {...field}
                      value={field.value}
                      onChange={(e) => {
                        let value = e.target.value;

                        if (value === "") {
                          field.onChange("");
                          return;
                        }

                        value = value.replace(/[^0-9.]/g, "");

                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = `${parts[0]}.${parts[1]}`;
                        }

                        // Limit to 2 decimal places
                        if (parts[1]?.length > 2) {
                          value = `${parts[0]}.${parts[1].substring(0, 2)}`;
                        }

                        if (value.startsWith("0")) {
                          value = value.replace(/^0+/, "");
                        }

                        // Limit total length to 10 characters
                        if (Math.floor(Number(value)).toString().length > 7) {
                          value = value.substring(0, 7);
                        }

                        field.onChange(value);
                      }}
                    />
                  )}
                />
                <Button
                  type="button"
                  className="h-12 bg-pageColor text-white"
                  onClick={() => {
                    if (!selectedEarnings) {
                      toast({
                        title: "Select an earnings",
                        description: "Please select an earnings",
                        variant: "destructive",
                      });
                      return;
                    }
                    setValue("amount", getMaxAmount().toString());
                  }}
                >
                  MAX
                </Button>
              </div>
              {errors.amount && (
                <p className="text-primaryRed text-sm mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Account Name */}
            <div>
              <Label htmlFor="accountName">Account Name</Label>
              <Controller
                name="accountName"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    id="accountName"
                    placeholder="Account Name"
                    {...field}
                  />
                )}
              />
              {errors.accountName && (
                <p className="text-primaryRed text-sm mt-1">
                  {errors.accountName.message}
                </p>
              )}
            </div>

            {/* Account Number */}
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Controller
                name="accountNumber"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    id="accountNumber"
                    placeholder="Account Number"
                    {...field}
                  />
                )}
              />
              {errors.accountNumber && (
                <p className="text-primaryRed text-sm mt-1">
                  {errors.accountNumber.message}
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div className="flex flex-col w-full space-y-2 ">
              <Label htmlFor="amount">Total Net Payout</Label>
              <div className="flex items-center justify-between w-full gap-2">
                <Input
                  id="amount"
                  className="w-full flex-grow"
                  readOnly
                  value={calculateFinalAmount(
                    Number(amount || 0),
                    selectedEarnings
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                />
              </div>
            </div>
            <p className="text-sm font-bold text-primaryRed">
              {
                "Note: 10% withdrawal fee will be deducted to your withdrawal amount."
              }
            </p>
            {/* Submit Button */}
            <div className="flex items-center justify-center gap-2">
              <Button
                disabled={isSubmitting || getMaxAmount() === 0}
                type="submit"
                className="bg-pageColor text-white rounded-xl py-6 px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>

          <DialogFooter></DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardWithdrawModalWithdraw;
