import ClientMonitoringPage from "@/components/ClientMonitoringPage/ClientMonitoringPage";
import { protectionClientMonitoringUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Client Monitoring",
  description: "Client Monitoring Page",
  openGraph: {
    url: "/client",
  },
};

const page = async () => {
  const { teamMemberProfile, redirect: redirectTo } =
    await protectionClientMonitoringUser();

  if (redirectTo) {
    redirect(redirectTo);
  }

  if (!teamMemberProfile) redirect("/500");

  return <ClientMonitoringPage />;
};

export default page;
