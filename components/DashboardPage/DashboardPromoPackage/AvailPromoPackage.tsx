"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PackageCard from "@/components/ui/packageCard";
import { useToast } from "@/hooks/use-toast";
import { createPromoPackageConnection } from "@/services/Package/Member";
import { useUserModalPackageStore } from "@/store/useModalPackageStore";
import { usePackageChartData } from "@/store/usePackageChartData";
import { usePromoPackageStore } from "@/store/usePromoPackageStore";
import { useUserTransactionHistoryStore } from "@/store/userTransactionHistoryStore";
import { useUserEarningsStore } from "@/store/useUserEarningsStore";
import { escapeFormData } from "@/utils/function";
import { zodResolver } from "@hookform/resolvers/zod";
import { alliance_member_table, package_table } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";
type Props = {
  pkg: package_table | [];
  teamMemberProfile: alliance_member_table;
  setSelectedPackage: Dispatch<SetStateAction<package_table | null>>;
  selectedPackage: package_table | null;
  setActive: Dispatch<SetStateAction<boolean>>;
  active: boolean;
};

const AvailPromoPackage = ({
  pkg,
  teamMemberProfile,
  setSelectedPackage,
  selectedPackage,
  setActive,
  active,
}: Props) => {
  const { earnings, setEarnings } = useUserEarningsStore();
  const { chartData, setChartData } = usePackageChartData();
  const { toast } = useToast();
  const { setPromoPackage } = usePromoPackageStore();
  const { setModalPackage: setOpen } = useUserModalPackageStore();
  const maxReinvestment =
    earnings?.alliance_olympus_earnings + earnings?.alliance_referral_bounty;
  const [maxAmount, setMaxAmount] = useState(maxReinvestment ?? 0);

  const { setAddTransactionHistory } = useUserTransactionHistoryStore();

  const formattedMaxAmount = maxAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formSchema = z.object({
    amount: z
      .string()
      .min(3, "Minimum amount is 300 pesos")
      .refine((val) => Number(val) >= 300, {
        message: "Minimum amount is 300 pesos",
      })

      .refine((val) => Number(val) <= Number(maxAmount), {
        message: `Amount cannot exceed ${formattedMaxAmount}`,
      }),
    packageId: z.string(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      packageId: selectedPackage?.package_id || "",
    },
  });

  const selectedPackageName = selectedPackage?.package_name;

  const amount = watch("amount");
  const computationData =
    selectedPackageName === "EASTER" ? Number(amount) * 0.15 : Number(amount);

  const computation = amount
    ? (Number(amount) * Number(selectedPackage?.package_percentage ?? 0)) / 100
    : 0;
  const sumOfTotal = Number(amount) + computation + computationData;

  const onSubmit = async (data: FormValues) => {
    try {
      const result = escapeFormData({ ...data, amount: Number(data.amount) });
      const now = new Date();
      const completionDate = new Date(
        now.getTime() +
          Number(selectedPackage?.packages_days ?? 0) * 24 * 60 * 60 * 1000
      );

      const packageConnection = await createPromoPackageConnection({
        packageData: {
          amount: Number(result.amount),
          packageId: selectedPackage?.package_id || "",
        },
        teamMemberId: teamMemberProfile.alliance_member_id,
      });

      const isEasterPackage =
        selectedPackage?.package_name === "EASTER"
          ? Number(result.amount) * 0.15
          : 0;

      const transactionHistory = {
        transaction_id: uuidv4(),
        transaction_date: new Date(),
        transaction_description: `Package Enrolled ${selectedPackage?.package_name} ${isEasterPackage ? "with 15% bonus" : ""}`,
        transaction_amount: isEasterPackage,
        transaction_member_id: teamMemberProfile?.alliance_member_id,
      };

      setAddTransactionHistory([
        {
          ...transactionHistory,
          transaction_amount: Number(result.amount) + isEasterPackage,
        },
      ]);

      toast({
        title: `Package Enrolled ${selectedPackage?.package_name}`,
        description: "You have successfully enrolled in   a package",
      });

      reset({ amount: "", packageId: selectedPackage?.package_id || "" });

      if (earnings) {
        let remainingAmount = Number(result.amount);

        const olympusDeduction = Math.min(
          remainingAmount,
          Number(earnings.alliance_olympus_earnings)
        );
        remainingAmount -= olympusDeduction;

        const referralDeduction = Math.min(
          remainingAmount,
          Number(earnings.alliance_referral_bounty)
        );
        remainingAmount -= referralDeduction;

        setEarnings({
          ...earnings,
          alliance_combined_earnings:
            Number(earnings.alliance_combined_earnings) - Number(result.amount),
          alliance_olympus_earnings:
            Number(earnings.alliance_olympus_earnings) -
            Number(olympusDeduction),
          alliance_referral_bounty:
            Number(earnings.alliance_referral_bounty) -
            Number(referralDeduction),
        });
      }

      setMaxAmount((prev) => Number(prev) - Number(result.amount));

      setChartData([
        {
          package: selectedPackage?.package_name || "",
          completion: 0,
          completion_date: completionDate.toISOString(),
          amount: Number(amount) + isEasterPackage,
          is_ready_to_claim: false,
          package_connection_id:
            packageConnection.package_member_connection_id || "",
          profit_amount: Number(computation),
          package_color: selectedPackage?.package_color || "",
          package_date_created: new Date().toISOString(),
          is_notified: false,
          package_member_id: teamMemberProfile?.alliance_member_id,
          package_days: Number(selectedPackage?.packages_days || 0),
          current_amount: Number(amount) + isEasterPackage,
          currentPercentage: 0,
        },
        ...chartData,
      ]);

      if (!active) {
        setActive(true);
      }

      setSelectedPackage(null);
      setPromoPackage(false);
      setOpen(false);
    } catch (e) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <PackageCard
        key={selectedPackage?.package_id}
        packageId={selectedPackage?.package_id}
        packageImage={selectedPackage?.package_image || undefined}
        packageName={selectedPackage?.package_name || ""}
        selectedPackage={selectedPackage || null}
        packageColor={selectedPackage?.package_color || undefined}
        onClick={() => {}}
      />
      <div className="grid grid-cols-1 gap-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 p-2">
            {/* amount to avail */}
            <div className="flex items-end gap-2 w-full">
              <div className="w-full">
                <Label className="font-bold block mb-2 text-green-700">
                  Balance: ₱ {formattedMaxAmount}
                </Label>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="amount"
                      type="text"
                      placeholder="Enter amount"
                      {...field}
                      className="w-full" // Set input width to 100%
                      value={field.value || ""}
                      onChange={(e) => {
                        let value = e.target.value;

                        if (value === "") {
                          field.onChange("");
                          return;
                        }

                        // Allow only numbers and a single decimal point
                        value = value.replace(/[^0-9]/g, "");

                        // Prevent multiple decimal points
                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = parts[0] + "." + parts[1]; // Keep only the first decimal part
                        }

                        // Ensure it doesn't start with multiple zeros (e.g., "00")
                        if (value.startsWith("0") && !value.startsWith("0.")) {
                          value = value.replace(/^0+/, "0");
                        }

                        // Limit decimal places to 2 (adjust as needed)
                        if (value.includes(".")) {
                          const [integerPart, decimalPart] = value.split(".");
                          value = `${integerPart}.${decimalPart.slice(0, 2)}`;
                        }

                        const amount = maxAmount;

                        // Enforce the maximum amount value
                        const numericValue = parseFloat(value || "0");
                        if (!isNaN(numericValue) && numericValue > amount) {
                          value = amount.toString(); // Adjust precision to match allowed decimals
                        }

                        field.onChange(value);
                      }}
                    />
                  )}
                />
              </div>
              <Button
                variant="card"
                type="button"
                onClick={() => {
                  setValue("amount", maxAmount.toFixed(2).toString());
                }}
                className="h-8 text-sm text-black"
              >
                Max
              </Button>
            </div>

            {errors.amount && (
              <p className="text-primaryRed text-sm">{errors.amount.message}</p>
            )}
            {/* no. days */}

            {selectedPackageName === "EASTER" && (
              <div className="flex flex-col gap-2 w-full justify-center items-center text-center">
                <Label className="font-bold text-center" htmlFor="Gross">
                  15 % Easter Bonus
                </Label>
                <Input
                  variant="default"
                  id="Gross"
                  readOnly
                  type="text"
                  className="text-center w-72" // Ensures full-width and text alignment
                  placeholder="Gross Income"
                  value={
                    computationData.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || ""
                  }
                />
              </div>
            )}

            <div className="flex flex-col gap-2 w-full justify-center items-center text-center">
              <Label className="font-bold text-center" htmlFor="Gross">
                Total Income after {selectedPackage?.packages_days} days
              </Label>
              <Input
                variant="default"
                id="Gross"
                readOnly
                type="text"
                className="text-center w-72" // Ensures full-width and text alignment
                placeholder="Gross Income"
                value={
                  sumOfTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || ""
                }
              />
            </div>

            <div className="flex flex-col gap-2 w-full  text-center pt-4 px-4">
              <Button
                disabled={isSubmitting || maxAmount === 0}
                type="submit"
                variant="card"
                className="  text-black  rounded-lg "
              >
                {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                Submit
              </Button>
            </div>
          </div>
        </form>
      </div>

      <Button
        variant="secondary"
        className="w-full rounded-md text-black"
        onClick={() => setSelectedPackage(null)}
      >
        Back to Packages
      </Button>
    </div>
  );
};

export default AvailPromoPackage;
