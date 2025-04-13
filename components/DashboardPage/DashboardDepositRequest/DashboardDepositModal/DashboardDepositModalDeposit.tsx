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
import { Loader2, XIcon } from "lucide-react";
import Image from "next/image";
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
  files: z
    .array(
      z
        .instanceof(File)
        .refine(
          (file) =>
            ["image/jpeg", "image/png", "image/jpg"].includes(file.type) &&
            file.size <= 12 * 1024 * 1024,
          { message: "Each file must be a valid image and less than 12MB." }
        )
    )
    .max(3, "You can upload up to 3 files."),
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
  const [needMoreReceipts, setNeedMoreReceipts] = useState(1);
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
      files: [],
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
    const filesArray = data.files.slice(0, needMoreReceipts).filter(Boolean);

    if (filesArray.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one file.",
        variant: "destructive",
      });
      return;
    }

    const sanitizedData = escapeFormData(data);

    const files = await Promise.all(
      filesArray.map(async (file) => {
        const filePath = `uploads/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabaseClient.storage
          .from("REQUEST_ATTACHMENTS")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          return toast({
            title: "Error",
            description: "Some files failed to upload. Please try again.",
            variant: "destructive",
          });
        }

        const publicUrl = `https://content.elevateglobal.app/storage/v1/object/public/REQUEST_ATTACHMENTS/${filePath}`;

        return { filePath, publicUrl };
      })
    );

    const publicUrls = files
      .map((file) => ("publicUrl" in file ? file.publicUrl : null))
      .filter(Boolean) as string[];

    if (publicUrls.length !== filesArray.length) {
      toast({
        title: "Error",
        description: "Some files failed to upload. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      await handleDepositRequest({
        TopUpFormValues: sanitizedData,
        publicUrls: publicUrls as string[],
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
          description: "Something went wrong",
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

  const bonusAmount = Number(watch("amount")) * 0.1;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          reset();
          setNeedMoreReceipts(1);
        }
      }}
    >
      <DialogTrigger asChild className={className}>
        {!canUserDeposit ? (
          <Button
            className="p-0 bg-transparent shadow-none h-full flex flex-col items-center justify-center relative"
            onClick={() => setOpen(true)}
          >
            <Image
              src="/assets/deposit.ico"
              alt="plans"
              width={35}
              height={35}
            />
            <p className="text-sm sm:text-lg font-thin ">DEPOSIT</p>
            <span className="absolute -top-6 text-[10px] sm:text-xs font-extrabold text-white px-2 py-[2px] rounded-md bg-blue-600 shadow-md ring-2 ring-blue-300 animate-wiggle ring-offset-1">
              <span className="inline-block">+ 10% Deposit Bonus!</span>
            </span>
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
              <Label htmlFor="amount">Bonus Amount</Label>

              <Input
                variant="default"
                type="text"
                id="amount"
                value={bonusAmount}
              />
            </div>

            {/* <div>
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
            </div> */}
            <div className="space-y-2 w-full max-w-xs sm:max-w-sm">
              <Label htmlFor="file-input">
                Upload Receipts or Proof of Payment
              </Label>

              {Array.from({ length: needMoreReceipts }, (_, index) => (
                <Controller
                  key={index}
                  name={`files.${index}`}
                  control={control}
                  render={({ field: { value, onChange, ...field } }) => (
                    <div className="space-y-2">
                      <div className="flex justify-center font-bold">
                        <p className="text-sm sm:text-md">STATUS: </p>
                        {value ? (
                          <p className="text-sm sm:text-md font-thin text-green-700">
                            RECEIPT UPLOADED SUCCESSFULLY
                          </p>
                        ) : (
                          <span className="text-sm sm:text-md font-thin text-red-700">
                            NO RECEIPT UPLOADED
                          </span>
                        )}
                      </div>
                      <Input
                        {...field}
                        id={`file-input-${index}`}
                        className="hidden"
                        type="file"
                        onChange={(e) => onChange(e.target.files?.[0] || null)}
                      />

                      <div className="flex justify-center gap-2 relative">
                        <Button
                          onClick={() => {
                            document
                              .getElementById(`file-input-${index}`)
                              ?.click();
                          }}
                          type="button"
                          variant="card"
                          className={`rounded-md text-sm sm:text-md ${
                            index > 0 ? "w-64 sm:w-full" : "w-full"
                          }`}
                        >
                          CLICK HERE TO UPLOAD RECEIPT {index + 1}
                        </Button>

                        {index > 0 && (
                          <Button
                            variant="card"
                            size="icon"
                            type="button"
                            className="text-sm sm:text-md p-0"
                            onClick={() => {
                              const currentFiles = watch("files");

                              const updatedFiles = currentFiles.filter(
                                (_, fileIndex) => fileIndex !== index
                              );

                              setValue("files", updatedFiles);

                              setNeedMoreReceipts((prev) => prev - 1);
                            }}
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {index === needMoreReceipts - 1 && index < 2 && (
                        <div className="flex justify-center">
                          <Button
                            onClick={() => {
                              if (needMoreReceipts < 3) {
                                setNeedMoreReceipts(needMoreReceipts + 1);
                              }
                            }}
                            type="button"
                            className="border-2 border-black rounded-md"
                          >
                            Add More Receipt
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                />
              ))}
              {errors.files && (
                <p className="text-primaryRed text-sm mt-1">
                  {errors.files.message}
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
