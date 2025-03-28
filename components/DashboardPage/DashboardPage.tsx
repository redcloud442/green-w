import { package_table } from "@prisma/client";
import DashboardBody from "./DashboardBody";
import DashboardHeader from "./DashboardHeader";
import NewlyRegisteredModal from "./NewlyRegisteredModal/NewlyRegisteredModal";

type Props = {
  packages: package_table[];
  sponsor: string;
};

const DashboardPage = ({ packages }: Props) => {
  return (
    <div className="relative min-h-screen mx-auto space-y-4 sm:px-0 sm:mb-20 overflow-x-hidden">
      <DashboardHeader />

      <NewlyRegisteredModal />

      <DashboardBody packages={packages} />
    </div>
  );
};

export default DashboardPage;
