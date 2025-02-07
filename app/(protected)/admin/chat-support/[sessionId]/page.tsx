import { AdminChatSupportSessionPage } from "@/components/AdminChatSupportSessionPage/AdminChatSupportSessionPage";
import prisma from "@/utils/prisma";
import { protectionAdminUser } from "@/utils/serversideProtection";
import { redirect } from "next/navigation";

const page = async ({ params }: { params: Promise<{ sessionId: string }> }) => {
  const { sessionId } = await params;

  const { teamMemberProfile, profile } = await protectionAdminUser();

  if (!teamMemberProfile) {
    redirect("/500");
  }

  const session = await prisma.chat_session_table.findUnique({
    where: {
      chat_session_id: sessionId,
    },
  });

  if (!session) {
    redirect("/500");
  }

  return (
    <AdminChatSupportSessionPage
      session={session}
      teamMemberId={teamMemberProfile.alliance_member_id}
      profile={profile}
    />
  );
};

export default page;
