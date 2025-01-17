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
import { ChartDataMember } from "@/utils/types";
import {
  alliance_earnings_table,
  alliance_member_table,
  package_table,
} from "@prisma/client";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

type Props = {
  className: string;
  teamMemberProfile: alliance_member_table;
  packages: package_table[];
  earnings: alliance_earnings_table | null;
  setEarnings: Dispatch<SetStateAction<alliance_earnings_table | null>>;
  setChartData: Dispatch<SetStateAction<ChartDataMember[]>>;
  setIsActive: Dispatch<SetStateAction<boolean>>;
};

const DashboardDepositModalPackages = ({
  className,
  packages: initialPackage,
  teamMemberProfile,
  earnings,
  setEarnings,
  setChartData,
  setIsActive,
}: Props) => {
  const supabaseClient = createClientSide();
  const [open, setOpen] = useState(false);
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
        if (!open) return;
        const data = await getPackageModalData();

        setPackages(data);
        if (!teamMemberProfile.alliance_member_is_active) {
          setIsActive(true);
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
            src="/assets/packages.png"
            alt="plans"
            width={300}
            height={300}
          />
          <p className="text-sm sm:text-lg font-thin absolute bottom-1/4">
            PACKAGES
          </p>
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
              setOpen={setOpen}
              setSelectedPackage={setSelectedPackage}
              earnings={earnings}
              pkg={selectedPackage}
              teamMemberProfile={teamMemberProfile}
              setEarnings={setEarnings}
              setChartData={setChartData}
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
