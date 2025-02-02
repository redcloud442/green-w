"use client";

import { logError } from "@/services/Error/ErrorLogs";
import { getAdminPackages } from "@/services/Package/Admin";
import { createClientSide } from "@/utils/supabase/client";
import { alliance_member_table, package_table } from "@prisma/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import EditPackagesModal from "../AdminPackagesPage/EditPackagesModal";
import { Card } from "../ui/card";
import CreatePackageModal from "./CreatePackageModal";

type Props = {
  teamMemberProfile: alliance_member_table;
};

const AdminPackageList = ({ teamMemberProfile }: Props) => {
  const supabase = createClientSide();
  const [packages, setPackages] = useState<package_table[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<package_table | null>(
    null
  );

  const fetchPackages = async () => {
    try {
      if (!teamMemberProfile) return;
      const fetchedPackages = await getAdminPackages();

      setPackages(fetchedPackages);
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabase, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/AdminPackagesPage/AdminPackagesPage.tsx",
        });
      }
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [teamMemberProfile]);

  const handleSelectPackage = (pkg: package_table) => {
    setSelectedPackage(pkg);
  };

  return (
    <div className="container mx-auto p-0 md:p-10">
      <div className="flex justify-between items-center">
        <h1 className="Title">List of Packages</h1>
        <CreatePackageModal
          closeModal={() => setSelectedPackage(null)}
          setPackages={setPackages}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <Card
            key={pkg.package_id}
            className={`border rounded-lg shadow-md p-6 flex flex-col items-center space-y-4 ${
              pkg.package_is_disabled
                ? "bg-gray-200 border-gray-400 opacity-50"
                : "border-gray-200"
            }`}
          >
            <Image
              src={pkg.package_image || "/images/package-default.png"}
              alt={pkg.package_name}
              width={300}
              height={300}
              className="object-cover"
            />
            <h2
              className={`text-xl font-bold ${pkg.package_is_disabled ? "text-gray-500" : ""}`}
            >
              {pkg.package_name}
            </h2>
            <p
              className={`text-center ${pkg.package_is_disabled ? "text-gray-500" : "text-gray-600 dark:text-white"}`}
            >
              {pkg.package_description}
            </p>
            <p
              className={`text-2xl text-center font-extrabold ${
                pkg.package_is_disabled
                  ? "text-gray-500"
                  : "text-gray-800 dark:text-white"
              }`}
            >
              {pkg.package_percentage}% Earnings in {pkg.packages_days} Days
            </p>

            {!pkg.package_is_disabled && (
              <EditPackagesModal
                teamMemberProfile={teamMemberProfile}
                selectedPackage={selectedPackage}
                handleSelectPackage={() => handleSelectPackage(pkg)}
                setPackages={setPackages}
                closeModal={() => setSelectedPackage(null)}
              />
            )}

            {pkg.package_is_disabled && (
              <div className="text-sm text-gray-500 italic">
                This package is currently disabled
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPackageList;
