"use client";
import { alliance_member_table } from "@prisma/client";
import Image from "next/image";
import AllyBountyTable from "./AllyBountyTable";

type Props = {
  teamMemberProfile: alliance_member_table;
  totalDirectReferral: number;
  totalDirectReferralCount: number;
};

const AllyBountyPage = ({
  teamMemberProfile,
  totalDirectReferral,
  totalDirectReferralCount,
}: Props) => {
  return (
    <div className="p-4 sm:p-10">
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
        <section className=" rounded-lg ">
          <AllyBountyTable
            teamMemberProfile={teamMemberProfile}
            totalDirectReferral={totalDirectReferral}
            totalDirectReferralCount={totalDirectReferralCount}
          />
        </section>
      </div>
    </div>
  );
};

export default AllyBountyPage;
