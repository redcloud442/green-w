"use client";
import { alliance_member_table } from "@prisma/client";
import Image from "next/image";
import LegionBountyTable from "./LegionBountyTable";

type Props = {
  teamMemberProfile: alliance_member_table;
};

const LegionBountyPage = ({ teamMemberProfile }: Props) => {
  return (
    <div className="md:p-10">
      <div>
        {/* Header Section */}
        <div className="flex justify-center items-start">
          <Image
            src="/app-logo.png"
            alt="referral-header"
            width={200}
            height={200}
          />
        </div>
        {/* Table Section */}
        <section className="rounded-lg ">
          <LegionBountyTable teamMemberProfile={teamMemberProfile} />
        </section>
      </div>
    </div>
  );
};

export default LegionBountyPage;
