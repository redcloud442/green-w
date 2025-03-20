"use client";

import { alliance_member_table } from "@prisma/client";
import TopUpTable from "./TopUpTable";

type Props = {
  teamMemberProfile: alliance_member_table;
};

const TopUpPage = ({ teamMemberProfile }: Props) => {
  return (
    <div className="mx-auto py-8 md:p-10">
      <div>
        <header className="mb-4">
          <h1 className="Title">Deposit List Page</h1>
          <p className="text-gray-600 dark:text-white">
            View all the deposit records that are currently in the system.
          </p>
        </header>

        {/* Table Section */}
        <section className="rounded-lg space-y-4">
          <TopUpTable teamMemberProfile={teamMemberProfile} />
        </section>
      </div>
    </div>
  );
};

export default TopUpPage;
