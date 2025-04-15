import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PackageCard from "@/components/ui/packageCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSelectedPackage } from "@/store/useSelectedPackage";
import { alliance_member_table, package_table } from "@prisma/client";
import { Dispatch, SetStateAction, useState } from "react";
import AvailPromoPackage from "./AvailPromoPackage";
type Props = {
  className: string;
  teamMemberProfile: alliance_member_table;
  packages: package_table[];
  setIsActive: Dispatch<SetStateAction<boolean>>;
  active: boolean;
};

const DashboardReinvestPromoPackage = ({
  className,
  packages: initialPackage,
  teamMemberProfile,
  setIsActive,
  active,
}: Props) => {
  const { selectedPackage, setSelectedPackage, setSelectedPackageToNull } =
    useSelectedPackage();
  const [isOpen, setIsOpen] = useState(false);

  const handlePackageSelect = (pkg: package_table) => {
    setSelectedPackage(pkg);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedPackageToNull();
          setIsOpen(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="bg-transparent p-2 shadow-none rounded-lg flex flex-col items-center justify-center relative text-balance h-10 w-full"
          variant="card"
          onClick={() => setIsOpen(true)}
        >
          CLICK HERE TO REINVEST
          <span className="absolute -top-6 -right-6 sm:-right-10 text-[9px] sm:text-[9px] font-extrabold text-white px-2 py-[2px] rounded-md bg-blue-600 shadow-md ring-2 ring-blue-300 animate-wiggle ring-offset-1">
            <span className="inline-block">+ 15% Bonus!</span>
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className={`sm:max-w-[425px]`}>
        <ScrollArea className="h-[650px] sm:h-fit">
          <DialogHeader>
            <DialogTitle>
              Alamin ang panibagong Package dito sa Elevate!
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col justify-between gap-4">
            <p className="text-md text-gray-500 text-center pt-10">
              Mag Deposit at iavail itong limited time package natin na hanggang
              APRIL 18 lang!
            </p>
            {!selectedPackage &&
              initialPackage.map((pkg) => (
                <PackageCard
                  key={pkg.package_id}
                  packageId={pkg.package_id}
                  packageImage={pkg.package_image || undefined}
                  packageName={pkg.package_name}
                  selectedPackage={selectedPackage || null}
                  packageColor={pkg.package_color || undefined}
                  onClick={() => handlePackageSelect(pkg)}
                />
              ))}
          </div>
          {selectedPackage && (
            <AvailPromoPackage
              active={active}
              setActive={setIsActive}
              pkg={selectedPackage}
              teamMemberProfile={teamMemberProfile}
            />
          )}
          <DialogFooter></DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardReinvestPromoPackage;
