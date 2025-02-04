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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/services/Error/ErrorLogs";
import { getMerchantOptions } from "@/services/Options/Options";
import { handleDepositRequest } from "@/services/TopUp/Member";
import { useUserHaveAlreadyWithdraw } from "@/store/userHaveAlreadyWithdraw";
import { useUserTransactionHistoryStore } from "@/store/userTransactionHistoryStore";
import { escapeFormData } from "@/utils/function";
import { createClientSide } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { alliance_member_table, merchant_table } from "@prisma/client";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { NextResponse } from "next/server";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

type Props = {
  teamMemberProfile: alliance_member_table;
  className: string;
};

const topUpFormSchema = z.object({
  amount: z
    .string()
    .min(3, "Amount is required and must be at least 300 pesos")
    .max(8, "Amount must be less than 8 digits")
    .regex(/^\d+$/, "Amount must be a number")
    .refine((amount) => parseInt(amount, 10) >= 300, {
      message: "Amount must be at least 300 pesos",
    }),
  topUpMode: z.string().min(1, "Top up mode is required"),
  accountName: z.string().min(1, "Field is required"),
  accountNumber: z.string().min(1, "Field is required"),
  receipt: z
    .string()
    .min(1, "Receipt is required")
    .max(5, "Receipt is required"),
  file: z
    .instanceof(File)
    .refine((file) => !!file, { message: "File is required" })
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/jpg"].includes(file.type) &&
        file.size <= 12 * 1024 * 1024, // 12MB limit
      { message: "File must be a valid image and less than 12MB." }
    ),
});

export type TopUpFormValues = z.infer<typeof topUpFormSchema>;

const DashboardDepositModalDeposit = ({
  className,
  teamMemberProfile,
}: Props) => {
  const supabaseClient = createClientSide();
  const { canUserDeposit, setCanUserDeposit } = useUserHaveAlreadyWithdraw();
  const [topUpOptions, setTopUpOptions] = useState<merchant_table[]>([]);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { setAddTransactionHistory } = useUserTransactionHistoryStore();
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TopUpFormValues>({
    resolver: zodResolver(topUpFormSchema),
    defaultValues: {
      amount: "",
      topUpMode: "",
      accountName: "",
      accountNumber: "",
      file: undefined,
      receipt: "",
    },
  });

  useEffect(() => {
    const getOptions = async () => {
      try {
        if (!open) return;
        const options = await getMerchantOptions();
        setTopUpOptions(options);
      } catch (e) {
        if (e instanceof Error) {
          await logError(supabaseClient, {
            errorMessage: e.message,
            stackTrace: e.stack,
            stackPath:
              "components/DashboardPage/DashboardDepositRequest/DashboardDepositModal/DashboardDepositModalDeposit.tsx",
          });
        }
      }
    };

    getOptions();
  }, [open]);

  const onSubmit = async (data: TopUpFormValues) => {
    try {
      const sanitizedData = escapeFormData(data);
      const file = data.file;

      const filePath = `uploads/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("REQUEST_ATTACHMENTS")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        return NextResponse.json(
          { error: "File upload failed.", details: uploadError.message },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = supabaseClient.storage
        .from("REQUEST_ATTACHMENTS")
        .getPublicUrl(filePath);

      await handleDepositRequest({
        TopUpFormValues: sanitizedData,
        publicUrl,
      });

      const transactionHistory = {
        transaction_id: uuidv4(),
        transaction_date: new Date(),
        transaction_description: "Deposit Ongoing",
        transaction_amount: Number(sanitizedData.amount),
        transaction_member_id: teamMemberProfile?.alliance_member_id,
      };
      setAddTransactionHistory([transactionHistory]);
      setCanUserDeposit(true);

      toast({
        title: "Elevate Deposit is now for review",
        description:
          "Elevate team will review your request and approve it soon.",
      });

      setOpen(false);
      reset();
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath:
            "components/DashboardPage/DashboardDepositRequest/DashboardDepositModal/DashboardDepositModalDeposit.tsx",
        });
        toast({
          title: "Error",
          description: e.message,
          variant: "destructive",
        });
      }
    }
  };

  const onTopUpModeChange = (value: string) => {
    const selectedOption = topUpOptions.find(
      (option) => option.merchant_id === value
    );

    if (selectedOption) {
      setValue("accountName", selectedOption.merchant_account_name || "");
      setValue("accountNumber", selectedOption.merchant_account_number || "");
    }
  };
  const uploadedFile = watch("file");

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
      <DialogTrigger asChild className={className}>
        {!canUserDeposit ? (
          <Button
            className="p-0 bg-transparent shadow-none h-full flex flex-col items-center justify-center"
            onClick={() => setOpen(true)}
          >
            <Image
              src="/assets/deposit.ico"
              alt="plans"
              width={35}
              height={35}
            />
            <p className="text-sm sm:text-lg font-thin ">DEPOSIT</p>
          </Button>
        ) : (
          <Popover>
            <PopoverTrigger className="bg-transparent pt-0 shadow-none h-full flex flex-col items-center justify-center">
              <Image
                src="/assets/deposit.ico"
                alt="plans"
                width={35}
                height={35}
              />
              <p className="text-sm sm:text-lg font-thin pt-2">DEPOSIT</p>
            </PopoverTrigger>
            <PopoverContent>
              Elevate is currently reviewing your deposit request. Please wait
              for the approval.
            </PopoverContent>
          </Popover>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px]">
        <ScrollArea className="h-[500px] sm:h-full">
          <DialogHeader className="flex flex-col items-center text-2xl font-bold">
            <DialogTitle className="text-2xl sm:text-3xl font-bold">
              Deposit
            </DialogTitle>
            <Separator className="w-full" />
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 w-full max-w-xs sm:max-w-sm "
          >
            {/* Top-Up Mode */}
            <div>
              <Label htmlFor="topUpMode">Select Bank Or E-Wallet</Label>
              <Controller
                name="topUpMode"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      onTopUpModeChange(value);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className="text-center">
                      <SelectValue placeholder="Select Bank Or E-Wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {topUpOptions.map((option) => (
                        <SelectItem
                          key={option.merchant_id}
                          value={option.merchant_id}
                        >
                          {option.merchant_account_type} -{" "}
                          {option.merchant_account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.topUpMode && (
                <p className="text-primaryRed text-sm mt-1">
                  {errors.topUpMode.message}
                </p>
              )}
            </div>

            {/* Account Details */}
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <Label htmlFor="accountName">Account Name</Label>
                <div className="flex gap-2">
                  <Controller
                    name="accountName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        readOnly
                        variant="default"
                        id="accountName"
                        placeholder="Account Name"
                        {...field}
                      />
                    )}
                  />
                </div>
                {errors.accountName && (
                  <p className="text-primaryRed text-sm mt-1">
                    {errors.accountName.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="accountNumber">Account Number</Label>
                <div className="flex gap-2">
                  <Controller
                    name="accountNumber"
                    control={control}
                    render={({ field }) => (
                      <Input
                        readOnly
                        id="accountNumber"
                        placeholder="Account Number"
                        {...field}
                      />
                    )}
                  />
                </div>
                {errors.accountNumber && (
                  <p className="text-primaryRed text-sm mt-1">
                    {errors.accountNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <Input
                    variant="default"
                    type="text"
                    id="amount"
                    className=""
                    placeholder="Ex. 300"
                    {...field}
                    autoFocus
                    value={field.value}
                    onChange={(e) => {
                      let inputValue = e.target.value;

                      // Allow clearing the value
                      if (inputValue === "") {
                        field.onChange("");
                        return;
                      }

                      // Remove non-numeric characters
                      inputValue = inputValue.replace(/[^0-9.]/g, "");

                      // Ensure only one decimal point
                      const parts = inputValue.split(".");
                      if (parts.length > 2) {
                        inputValue = parts[0] + "." + parts[1];
                      }

                      // Limit to two decimal places
                      if (parts[1]?.length > 2) {
                        inputValue = `${parts[0]}.${parts[1].substring(0, 2)}`;
                      }

                      if (inputValue.length > 8) {
                        inputValue = inputValue.substring(0, 8);
                      }

                      // Update the field value
                      field.onChange(inputValue);

                      // Enforce max amount
                      const numericValue = Number(inputValue);

                      setValue("amount", numericValue.toString());
                    }}
                  />
                )}
              />
              {errors.amount && (
                <p className="text-primaryRed text-sm mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="receipt">
                Last 5 digits of your Receipt Reference No.
              </Label>
              <Controller
                name="receipt"
                control={control}
                render={({ field }) => (
                  <Input
                    variant="default"
                    type="text"
                    id="receipt"
                    className=""
                    placeholder="Ex. 12345"
                    {...field}
                    value={field.value}
                    onChange={(e) => {
                      let inputValue = e.target.value;

                      // Allow clearing the value
                      if (inputValue === "") {
                        field.onChange("");
                        return;
                      }

                      if (inputValue.length > 5) {
                        inputValue = inputValue.substring(0, 5);
                      }

                      field.onChange(inputValue);

                      setValue("receipt", inputValue);
                    }}
                  />
                )}
              />
              {errors.receipt && (
                <p className="text-primaryRed text-sm mt-1">
                  {errors.receipt.message}
                </p>
              )}
            </div>

            <div className="">
              <Controller
                name="file"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <div className="space-y-2">
                    <Label htmlFor="file-input">
                      Upload Receipt or Proof of Payment
                    </Label>
                    <div className="flex justify-center font-bold">
                      <p className="text-md">STATUS: </p>{" "}
                      {uploadedFile ? (
                        <p className="text-md font-thin text-green-700">
                          RECEIPT UPLOADED SUCCESSFULLY
                        </p>
                      ) : (
                        <p className="text-md font-thin text-red-700">
                          NO RECEIPT UPLOADED
                        </p>
                      )}
                    </div>
                    {/* Hidden file input */}
                    <Input
                      {...field}
                      id="file-input"
                      className="hidden"
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        onChange(file);
                      }}
                    />
                    {/* Trigger button */}
                    <Button
                      onClick={() => {
                        document.getElementById("file-input")?.click();
                      }}
                      type="button"
                      variant="card"
                      className="w-full rounded-md"
                    >
                      CLICK HERE TO UPLOAD RECEIPT
                    </Button>
                  </div>
                )}
              />
              {/* Uploaded file status */}

              {/* Error message */}
              {errors.file && (
                <p className="text-primaryRed text-sm mt-1">
                  {errors.file?.message}
                </p>
              )}
            </div>

            <Button
              variant="card"
              className="w-full rounded-md"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}{" "}
              SUBMIT
            </Button>
          </form>
          <DialogFooter></DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardDepositModalDeposit;
