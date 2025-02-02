import { useToast } from "@/hooks/use-toast";
import { logError } from "@/services/Error/ErrorLogs";
import { handleUpdateBalance } from "@/services/merchant/Merchant";
import { escapeFormData } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { UserRequestdata } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { merchant_balance_log, user_table } from "@prisma/client";
import { PhilippinePeso } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import TableLoading from "../ui/tableLoading";
import MerchantBalanceModal from "./MerchantBalanceModal";
type Props = {
  userProfile: UserRequestdata;
  profile: user_table;
};

const schema = z.object({
  balance: z
    .string()
    .min(1, "Amount is required")
    .max(100000000, "Maximum amount allowed is 1,000,000")
    .transform((value) => Number(value)),
});
type Data = z.infer<typeof schema>;

const MerchantBalance = ({ userProfile, profile }: Props) => {
  const { toast } = useToast();
  const supabaseClient = createClientSide();
  const [isLoading, setIsLoading] = useState(false);
  const [merchantData, setMerchantData] =
    useState<UserRequestdata>(userProfile);
  const [merchantBalanceHistory, setMerchantBalanceHistory] = useState({
    data: [] as merchant_balance_log[],
    count: 0,
  });
  const cache = useRef<
    Record<number, { data: merchant_balance_log[]; count: number }>
  >({});

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Data>({
    resolver: zodResolver(schema),
  });

  const handleUpdateMerchantBalance = async (data: Data) => {
    try {
      setIsLoading(true);

      const sanitizedData = escapeFormData(data);

      await handleUpdateBalance({
        amount: Number(sanitizedData.balance),
        memberId: userProfile.merchant_member_id,
        userName: profile.user_username || "",
      });

      setMerchantData((prev) => ({
        ...prev,
        merchant_member_balance:
          Number(sanitizedData.balance) + merchantData.merchant_member_balance,
      }));

      setMerchantBalanceHistory((prev) => ({
        ...prev,
        data: [
          {
            merchant_balance_log_id: uuidv4(),
            merchant_balance_log_date: new Date(),
            merchant_balance_log_amount: Number(sanitizedData.balance),
            merchant_balance_log_user: userProfile.user_username || "",
          },
          ...prev.data,
        ],
        count: prev.count + 1,
      }));
      toast({
        title: "Merchant Balance Updated Successfully",
      });
      reset();
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/UserAdminProfile/MerchantBalance.tsx",
        });
      }
      toast({
        title: "Error",
        description:
          e instanceof Error ? e.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      {isLoading && <TableLoading />}
      <CardHeader className=" border-b pb-4">
        <div className=" flex justify-between">
          <CardTitle className="text-lg font-semibold">
            Merchant Balance
          </CardTitle>
          <span className="text-lg font-medium flex items-center gap-2">
            Current Balance: <PhilippinePeso size={16} />
            {merchantData.merchant_member_balance?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0.00"}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <form
          className="flex flex-col gap-4 pt-6"
          onSubmit={handleSubmit(handleUpdateMerchantBalance)}
        >
          <Controller
            name="balance"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                placeholder="Enter the top-up amount (e.g., 1000)"
                {...field}
                autoFocus
                value={field.value || ""}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\D/g, "");

                  if (value.startsWith("0")) {
                    value = value.replace(/^0+/, "");
                  }

                  if (Number(value) > 100000000) {
                    return;
                  }

                  field.onChange(value);
                }}
              />
            )}
          />
          {errors.balance && (
            <span className="text-red-500 text-xs">
              {errors.balance.message?.toString()}
            </span>
          )}
          <Button type="submit" variant="outline">
            Update Balance
          </Button>
          <MerchantBalanceModal
            cache={cache}
            merchantBalanceHistory={merchantBalanceHistory}
            setMerchantBalanceHistory={setMerchantBalanceHistory}
            userProfile={userProfile}
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default MerchantBalance;
