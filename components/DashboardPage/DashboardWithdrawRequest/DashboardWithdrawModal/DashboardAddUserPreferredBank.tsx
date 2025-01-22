"use client";
import { handleAddPreferredWithdrawal } from "@/app/actions/withdrawal/withdrawalAction";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FINANCIAL_SERVICES } from "@/utils/constant";
import { alliance_preferred_withdrawal_table } from "@prisma/client";
import { PlusIcon } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { z } from "zod";

type DashboardAddUserPreferredBankProps = {
  setPreferredEarnings: Dispatch<
    SetStateAction<alliance_preferred_withdrawal_table | null>
  >;
  preferredWithdrawalList: alliance_preferred_withdrawal_table[];
  setPreferredWithdrawalList: Dispatch<
    SetStateAction<alliance_preferred_withdrawal_table[]>
  >;
  isFetching: boolean;
};

export const preferredWithdrawalSchema = z.object({
  accountName: z.string().min(2, { message: "Account Name is required" }),
  accountNumber: z.string().min(10, { message: "Account Number is required" }),
  bankName: z.string().min(2, { message: "Bank Name is required" }),
});

const DashboardAddUserPreferredBank = ({
  preferredWithdrawalList,
  setPreferredEarnings,
  setPreferredWithdrawalList,
  isFetching,
}: DashboardAddUserPreferredBankProps) => {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (formData: FormData) => {
    const validation = preferredWithdrawalSchema.safeParse({
      accountName: formData.get("accountName")?.toString(),
      accountNumber: formData.get("accountNumber")?.toString(),
      bankName: formData.get("bankName")?.toString(),
    });

    if (!validation.success) {
      toast({
        title: "Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const data = await handleAddPreferredWithdrawal(formData);

      toast({
        title: "Success",
        description: "Preferred withdrawal added successfully",
      });
      setPreferredWithdrawalList((prev) => {
        if (!prev) {
          return [data as alliance_preferred_withdrawal_table];
        }
        return [...prev, data as alliance_preferred_withdrawal_table];
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add preferred withdrawal",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-2xl font-extrabold">FAVORITES</p>

      {/* Add Account Button */}
      <div
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 border-2 border-white p-2 cursor-pointer"
      >
        <p className="text-sm">ADD BYBIT ACCOUNT, EWALLET OR BANK DETAILS</p>
        <PlusIcon />
      </div>

      {open && (
        <Card className="p-4 bg-sky-300 w-full max-w-[320px] sm:max-w-md">
          <form
            action={(formData) => handleSubmit(formData)}
            className="space-y-4"
          >
            <Input type="text" name="accountName" placeholder="Account Name" />
            <Input
              type="text"
              name="accountNumber"
              placeholder="Account Number"
            />
            <Select
              onValueChange={(value) => {
                const bankNameInput = document.getElementById(
                  "bankName"
                ) as HTMLInputElement;
                bankNameInput.value = value;
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Bank Or E-Wallets" />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_SERVICES.map((bank, index) => (
                  <SelectItem key={index} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Hidden input to store selected bankName */}
            <Input type="hidden" id="bankName" name="bankName" />

            <Button
              disabled={isLoading}
              variant="card"
              className="w-full rounded-md"
              type="submit"
            >
              {isLoading ? "Adding..." : "SET TO FAVORITES"}
            </Button>
            <Button
              className=" w-full rounded-md"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setSelectedOption("");
              }}
            >
              close
            </Button>
          </form>
        </Card>
      )}

      {/* Favorite Card with Radio Button */}
      <ScrollArea className="min-h-auto max-h-[200px]">
        <div className="flex flex-col gap-2 border-2 border-white p-2">
          {isFetching ? (
            <Skeleton className="h-12 w-full rounded-lg" />
          ) : (
            preferredWithdrawalList?.map((item) => (
              <Card
                onClick={() =>
                  setSelectedOption(item.alliance_preferred_withdrawal_id)
                }
                key={item.alliance_preferred_withdrawal_id}
                className="flex items-center justify-between bg-sky-300 px-4 py-1"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-extrabold">
                    {item.alliance_preferred_withdrawal_bank_name}
                  </p>
                  <p className="text-sm">
                    ACCOUNT NAME:{" "}
                    {item.alliance_preferred_withdrawal_account_name}
                  </p>
                  <p className="text-sm">
                    ACCOUNT NUMBER:{" "}
                    {item.alliance_preferred_withdrawal_account_number}
                  </p>
                </div>
                <div>
                  <Input
                    type="radio"
                    name="preferredEarnings"
                    value={item.alliance_preferred_withdrawal_id}
                    checked={
                      selectedOption === item.alliance_preferred_withdrawal_id
                    }
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="w-4 h-4"
                  />
                </div>
              </Card>
            ))
          )}
          {preferredWithdrawalList?.length === 0 && (
            <p className="text-sm">No favorite accounts found</p>
          )}
        </div>
      </ScrollArea>

      {/* Submit Button */}
      <div className="flex justify-center items-center">
        <Button
          type="button"
          onClick={() => {
            if (!selectedOption) {
              toast({
                title: "Error",
                description: "Please select an account before submitting.",
                variant: "destructive",
              });
              return;
            }

            setPreferredEarnings(
              preferredWithdrawalList.find(
                (item) =>
                  item.alliance_preferred_withdrawal_id === selectedOption
              ) as alliance_preferred_withdrawal_table
            );

            setOpen(false);
          }}
          variant="card"
          className="w-72 sm:w-full rounded-md"
        >
          SUBMIT FOR WITHDRAWAL
        </Button>
      </div>
    </div>
  );
};

export default DashboardAddUserPreferredBank;
