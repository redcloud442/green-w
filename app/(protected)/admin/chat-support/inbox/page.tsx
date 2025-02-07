import AdminChatInboxPage from "@/components/AdminChatInboxPage/AdminChatInboxPage";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { redirect } from "next/navigation";

const page = async () => {
  const { teamMemberProfile, profile } = await protectionAdminUser();

  if (!teamMemberProfile) {
    redirect("/500");
  }

  return (
    <AdminChatInboxPage
      teamMemberProfile={teamMemberProfile}
      userUsername={profile?.user_username}
    />
  );
};

export default page;
