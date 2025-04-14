import { package_table } from "@prisma/client";
import DashboardBody from "./DashboardBody";
import DashboardHeader from "./DashboardHeader";

type Props = {
  packages: package_table[];
  sponsor: string;
  promoPackages: package_table[];
};

const DashboardPage = ({ packages, promoPackages }: Props) => {
  return (
    <div className="relative min-h-screen mx-auto space-y-4 sm:px-0 sm:mb-20 overflow-x-hidden">
      <DashboardHeader />

      <DashboardBody packages={packages} promoPackages={promoPackages} />
    </div>
  );
};

export default DashboardPage;
