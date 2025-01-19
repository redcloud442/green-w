import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

type Props = {
  isActive: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const NewlyRegisteredModal = ({ isActive, setOpen }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsModalOpen(true);
    }
  }, []);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Welcome to Elevate and Congratulations on your free account!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm">
            Mag Deposit na para makapag avail na ng Package para masimulan ng
            kumita!
          </p>

          <Button
            variant="card"
            className="w-full  rounded-md"
            onClick={() => {
              setIsModalOpen(false);
              setOpen(true);
            }}
          >
            Explore Packages
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewlyRegisteredModal;
