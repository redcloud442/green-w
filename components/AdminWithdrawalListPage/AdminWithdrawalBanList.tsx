import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { uploadAdminWithdrawalBanList } from "@/services/Withdrawal/Admin";
import { escapeFormData } from "@/utils/function";
import { zodResolver } from "@hookform/resolvers/zod";
import { alliance_member_table } from "@prisma/client";
import { DialogTitle } from "@radix-ui/react-dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "../ui/input";
import AdminBanListTable from "./AdminWithdrawalBanTable";

type Props = {
  teamMemberProfile: alliance_member_table;
};

const schema = z.object({
  accountNumber: z.string().min(6, { message: "Account number is required" }),
});

type FilterFormValues = z.infer<typeof schema>;

const AdminBanListModal = ({ teamMemberProfile }: Props) => {
  const [open, setOpen] = useState(false);
  const [requestData, setRequestData] = useState<{ accountNumber: string }[]>(
    []
  );
  const [requestCount, setRequestCount] = useState(0);

  const {
    getValues,
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FilterFormValues>({
    defaultValues: {
      accountNumber: "",
    },
    resolver: zodResolver(schema),
  });

  const handleUploadBanList = async () => {
    try {
      const sanitizedData = escapeFormData(getValues());

      const { accountNumber } = sanitizedData;

      await uploadAdminWithdrawalBanList({
        accountNumber,
      });

      setRequestData((prev) => [...prev, { accountNumber }]);
      setRequestCount((prev) => prev + 1);

      reset();

      toast({
        title: "Successfully uploaded ban list",
        description: "Please refresh the page to see the changes",
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Failed to upload ban list",
          description: error.message,
        });
      }
    }
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
          variant="card"
          className="dark:bg-pageColor dark:text-white h-8 rounded-sm w-full sm:w-auto"
          onClick={() => setOpen(true)}
        >
          Ban List
        </Button>
      </DialogTrigger>

      <DialogContent
        type="table"
        className="w-[350px] sm:w-[600px] dark:bg-cardColor border-none shadow-none overflow-auto p-0 pt-10"
      >
        <ScrollArea className="h-[500px] w-full sm:h-full px-2">
          <DialogTitle className=" text-2xl font-bold">Ban List</DialogTitle>
          <form
            className="flex gap-2 pt-4 px-10"
            onSubmit={handleSubmit(handleUploadBanList)}
          >
            <div className="flex flex-col gap-2 flex-1">
              <Input {...register("accountNumber")} />
              {errors.accountNumber && (
                <p className="text-primaryRed text-sm mt-1">
                  {errors.accountNumber.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="card"
              className="w-full sm:w-auto rounded-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Uploading..." : "Upload"}
            </Button>
          </form>
          <AdminBanListTable
            teamMemberProfile={teamMemberProfile}
            requestData={requestData}
            requestCount={requestCount}
            setRequestCount={setRequestCount}
            setRequestData={setRequestData}
          />
          <DialogFooter className="flex justify-center"></DialogFooter>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBanListModal;
