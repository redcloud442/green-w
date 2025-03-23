import Image from "next/image";
import LegionBountyTable from "./LegionBountyTable";

type Props = {
  totalNetwork?: number;
};

const LegionBountyPage = ({ totalNetwork }: Props) => {
  return (
    <div className="md:p-10">
      <div>
        {/* Header Section */}
        <div className="flex justify-center items-start">
          <Image
            src="/app-logo.png"
            alt="network-header"
            width={200}
            height={200}
          />
        </div>
        {/* Table Section */}
        <section className="rounded-lg ">
          <LegionBountyTable totalNetwork={totalNetwork} />
        </section>
      </div>
    </div>
  );
};

export default LegionBountyPage;
