import { ChatSupportPage } from "@/components/ChatSupportPage/ChatSupportPage";
import { protectionChatPageMemberUser } from "@/utils/serversideProtection";
import { redirect } from "next/navigation";

const page = async () => {
  const { teamMemberProfile, profile, session } =
    await protectionChatPageMemberUser();

  if (!teamMemberProfile) {
    redirect("/500");
  }

  return (
    <ChatSupportPage
      session={session}
      teamMemberId={teamMemberProfile?.alliance_member_id}
      profile={profile}
    />
  );
};

export default page;
