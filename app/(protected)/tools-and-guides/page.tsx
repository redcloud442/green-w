import ToolsAndGuides from "@/components/ToolsAndGuides/ToolsAndGuides";
import { protectionAllUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tools & Guides",
  description: "Tools & Guides Page",
  openGraph: {
    url: "/tools-and-guides",
  },
};

const Page = async () => {
  const { teamMemberProfile } = await protectionAllUser();

  if (!teamMemberProfile) return redirect("/500");

  return <ToolsAndGuides />;
};

export default Page;
