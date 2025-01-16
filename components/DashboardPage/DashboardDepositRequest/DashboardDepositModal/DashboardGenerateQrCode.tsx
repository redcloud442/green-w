import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollBar } from "@/components/ui/scroll-area";
import { DialogTitle } from "@radix-ui/react-dialog";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { QrCodeIcon } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";

type Props = {
  url: string;
};

const DashboardGenerateQrCode = ({ url }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="dark:bg-pageColor  dark:text-white h-12 p-4 absolute top-10 left-1/4"
          onClick={() => setOpen(true)}
        >
          QR <QrCodeIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent
        type="table"
        className="w-auto dark:bg-cardColor border-none shadow-none overflow-auto"
      >
        <ScrollArea className=" sm:h-full space-y-4 text-center">
          <DialogTitle className=" text-2xl font-bold">
            Referral QR Code
          </DialogTitle>
          {url && (
            <div className="bg-white p-4 rounded shadow-md">
              <QRCode value={url} size={200} />
            </div>
          )}
          <DialogFooter className="flex justify-center"></DialogFooter>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardGenerateQrCode;
