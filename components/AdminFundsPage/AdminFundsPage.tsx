"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { updateFunds } from "@/services/Package/Admin";
import { package_company_funds_table } from "@prisma/client";
import { PhilippinePeso } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import CardAmountAdmin from "../ui/CardAmountAdmin";
type AdminFundsForm = {
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
  } = useForm<AdminFundsForm>({
    defaultValues: {
      amount: "",
    },
  });

  const onSubmit = async (data: AdminFundsForm) => {
    try {
      await updateFunds({
        amount: Number(data.amount),
      });

      setFundsAmount((prev) => prev + Number(data.amount));

      reset();

      toast({
        title: "Funds Updated",
        description: "Funds has been updated successfully",
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
        {/* Start Amount */}
        <Input
          {...register("amount", { required: true })}
          placeholder="Amount"
          type="number"
        />
        {errors.amount && (
          <span className="text-red-500">Amount is required</span>
        )}

        {/* End Amount */}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="card"
          className="rounded-md"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
};

export default AdminFundsPage;
