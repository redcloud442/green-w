import AvailPackagePage from "@/components/AvailPackagePage/AvailPackagePage";
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
import PackageCard from "@/components/ui/packageCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { alliance_member_table, package_table } from "@prisma/client";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";

type Props = {
  className: string;
  teamMemberProfile: alliance_member_table;
  packages: package_table[];
  setIsActive: Dispatch<SetStateAction<boolean>>;
  active: boolean;
};

const DashboardPromoPackage = ({
  className,
  packages: initialPackage,
  teamMemberProfile,
  setIsActive,
  active,
}: Props) => {
  const [selectedPackage, setSelectedPackage] = useState<package_table | null>(
    null
  );

  const [open, setOpen] = useState(true);

  const handlePackageSelect = (pkg: package_table | null) => {
    setSelectedPackage(pkg);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          setSelectedPackage(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="bg-transparent p-0 shadow-none h-full flex flex-col items-center justify-center relative"
          onClick={() => setOpen(true)}
        >
          {/* Wiggle image */}
          <Image
            src="/assets/easter-egg.ico"
            alt="Easter Plan"
            width={35}
            height={35}
            className="animate-wiggle"
          />

          {/* Label */}
          <p className="text-sm sm:text-lg font-thin">EASTER PACKAGE</p>

          {/* Bouncing promo badge */}
          <span className="absolute -top-10 text-[10px] sm:text-xs font-extrabold text-white px-2 py-[2px] rounded-md bg-blue-600 shadow-md ring-2 ring-blue-300 animate-wiggle ring-offset-1">
            <span className="inline-block text-balance">
              Until April 18 Only + 15% Bonus!
            </span>
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent
        className={`sm:max-w-[425px] ${selectedPackage ? "bg-cardColor" : "bg-transparent"} p-0`}
      >
        <ScrollArea className="h-[650px] sm:h-full">
          <DialogHeader className="text-start text-2xl font-bold">
            <DialogTitle className="text-2xl font-bold"></DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="flex flex-col justify-between gap-4">
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
            <AvailPackagePage
              active={active}
              setActive={setIsActive}
              setSelectedPackage={setSelectedPackage}
              pkg={selectedPackage}
              teamMemberProfile={teamMemberProfile}
              selectedPackage={selectedPackage}
            />
          )}
          <DialogFooter></DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardPromoPackage;
