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
import { logError } from "@/services/Error/ErrorLogs";
import { getPackageModalData } from "@/services/Package/Member";
import { createClientSide } from "@/utils/supabase/client";
import { alliance_member_table, package_table } from "@prisma/client";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

type Props = {
  className: string;
  teamMemberProfile: alliance_member_table;
  packages: package_table[];

  setIsActive: Dispatch<SetStateAction<boolean>>;
  open: boolean;
  active: boolean;
  setOpen: (open: boolean) => void;
};

const DashboardDepositModalPackages = ({
  className,
  packages: initialPackage,
  teamMemberProfile,
  setIsActive,
  open,
  active,
  setOpen,
}: Props) => {
  const supabaseClient = createClientSide();
  const [selectedPackage, setSelectedPackage] = useState<package_table | null>(
    null
  );
  const [packages, setPackages] = useState<package_table[]>(initialPackage);

  const handlePackageSelect = (pkg: package_table) => {
    setSelectedPackage(pkg);
  };

  useEffect(() => {
    const packagesData = async () => {
      try {
        if (!open || packages.length > 0) return;
        const data = await getPackageModalData();

        setPackages(data);
        if (!teamMemberProfile.alliance_member_is_active) {
        }
      } catch (e) {
        if (e instanceof Error) {
          await logError(supabaseClient, {
            errorMessage: e.message,
            stackTrace: e.stack,
            stackPath:
              "components/DashboardPage/DashboardDepositRequest/DashboardDepositModal/DashboardDepositPackagesModal.tsx",
          });
        }
      }
    };

    packagesData();
  }, [teamMemberProfile, open]);

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
      <DialogTrigger asChild className={className}>
        <Button
          className="bg-transparent p-0 shadow-none h-full flex flex-col items-center justify-center"
          onClick={() => setOpen(true)}
        >
          <Image
            src="/assets/packages.ico"
            alt="plans"
            width={35}
            height={35}
          />
          <p className="text-sm sm:text-lg font-thin">PACKAGES</p>
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
              packages.map((pkg) => (
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
              setOpen={setOpen}
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

export default DashboardDepositModalPackages;
