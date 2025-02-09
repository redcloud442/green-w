import { ChatSupportPage } from "@/components/ChatSupportPage/ChatSupportPage";
import { protectionChatPageMemberUser } from "@/utils/serversideProtection";
import { redirect } from "next/navigation";

const page = async () => {
  const { teamMemberProfile, profile, session } =
    await protectionChatPageMemberUser();

  if (!session) {
    redirect("/");
  }

  if (session.chat_session_status !== "WAITING FOR SUPPORT") {
    redirect("/");
  }

  if (!teamMemberProfile) {
    redirect("/500");
  }

  return (
    <ChatSupportPage
      teamId={teamMemberProfile?.alliance_member_alliance_id}
      session={session}
      teamMemberId={teamMemberProfile?.alliance_member_id}
      profile={profile}
    />
  );
};

export default page;
