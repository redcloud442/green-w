import { AdminChatSupportPage } from "@/components/AdminChatSupportPage/AdminChatSupportPage";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { redirect } from "next/navigation";

const page = async () => {
  const { teamMemberProfile } = await protectionAdminUser();

  if (!teamMemberProfile) {
    redirect("/500");
  }

  return <AdminChatSupportPage teamMemberProfile={teamMemberProfile} />;
};

export default page;
