"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // ✅ make sure you’re using your wrapped version
import { toast } from "@/hooks/use-toast";
import { updateFunds } from "@/services/Package/Admin";
import { package_company_funds_table } from "@prisma/client";
import { PhilippinePeso } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import CardAmountAdmin from "../ui/CardAmountAdmin";

type AdminFundsForm = {
  type: "add" | "deduct";
  amount: string;
};

type Props = {
  funds: package_company_funds_table[];
};

const AdminFundsPage = ({ funds }: Props) => {
  const [fundsAmount, setFundsAmount] = useState(
    funds[0].package_company_funds_amount
  );
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<AdminFundsForm>({
    defaultValues: {
      amount: "",
      type: "add",
    },
  });

  const type = watch("type");

  const onSubmit = async (data: AdminFundsForm) => {
    try {
      const amountValue = Number(data.amount);
      const finalAmount = data.type === "deduct" ? amountValue : amountValue;

      await updateFunds({
        amount: finalAmount,
        type: data.type,
      });

      if (data.type === "add") {
        setFundsAmount((prev) => prev + finalAmount);
      } else {
        setFundsAmount((prev) => prev - finalAmount);
      }

      reset();

      toast({
        title: "Funds Updated",
        description: `Successfully ${data.type === "add" ? "added" : "deducted"} ₱${amountValue.toLocaleString()}`,
      });
    } catch (error) {
      toast({
        title: "Error Updating Package Fund",
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Package Fund Update</h2>

      <CardAmountAdmin
        title="Total Company Funds"
        value={
          <>
            <PhilippinePeso />
            {fundsAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </>
        }
        description=""
        descriptionClassName="text-sm text-gray-500"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 flex flex-col gap-4"
      >
        {/* Select Type: Add or Deduct */}
        <Select
          value={type}
          onValueChange={(value) => setValue("type", value as "add" | "deduct")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add">Add Funds</SelectItem>
            <SelectItem value="deduct">Deduct Funds</SelectItem>
          </SelectContent>
        </Select>

        {/* Amount Input */}
        <Input
          {...register("amount", { required: true })}
          placeholder="Amount"
          type="number"
        />
        {errors.amount && (
          <span className="text-red-500">Amount is required</span>
        )}

        <Button
          type="submit"
          variant="card"
          className="rounded-md"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Submitting..."
            : type === "deduct"
              ? "Deduct"
              : "Add"}
        </Button>
      </form>
    </div>
  );
};

export default AdminFundsPage;
