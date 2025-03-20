"use client";
import { alliance_member_table } from "@prisma/client";
import AdminTopUpApprovalTable from "./AdminTopUpApprovalTable";

type Props = {
  teamMemberProfile: alliance_member_table;
};

const AdminTopUpApprovalPage = ({ teamMemberProfile }: Props) => {
  return (
    <div className="mx-auto md:p-10">
      <div>
        <header className="mb-4">
          <h1 className="Title">Deposit History List Page</h1>
          <p className="text-gray-600 dark:text-white">
            View all your transactions that are currently in the system.
          </p>
        </header>

        {/* Table Section */}
        <section className=" rounded-lg space-y-4">
          <AdminTopUpApprovalTable teamMemberProfile={teamMemberProfile} />
        </section>
      </div>
    </div>
  );
};

export default AdminTopUpApprovalPage;
