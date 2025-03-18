"use client";
import { alliance_member_table } from "@prisma/client";
import Image from "next/image";
import LegionBountyTable from "./LegionBountyTable";

type Props = {
  teamMemberProfile: alliance_member_table;
  totalNetwork?: number;
};

const LegionBountyPage = ({ teamMemberProfile, totalNetwork }: Props) => {
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
          <LegionBountyTable
            teamMemberProfile={teamMemberProfile}
            totalNetwork={totalNetwork}
          />
        </section>
      </div>
    </div>
  );
};

export default LegionBountyPage;
