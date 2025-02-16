import RegisterPage from "@/components/registerPage/registerPage";
import prisma from "@/utils/prisma";
import { protectionRegisteredUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Your Account | Join Elevate Community",
  description:
    "Sign up and create your account to enjoy exclusive access to personalized features, services, and updates tailored just for you.",
  openGraph: {
    title: "Register an Account | Join Now",
    description:
      "Create an account to gain access to personalized experiences, exclusive benefits, and the latest updates.",
    url: "https://elevateglobal.app/register",
    type: "website",
    images: [
      {
        url: "https://elevateglobal.app/app-logo.png",
        alt: "Join Now - Register an Account",
        width: 1200,
        height: 630,
      },
    ],
    siteName: "Elevate Global",
  },
};
const Page = async ({
  params,
}: {
  params: Promise<{ registerName: string }>;
}) => {
  const { registerName } = await params;
  const result = await protectionRegisteredUser();

  if (result?.redirect || !registerName) {
    redirect("/");
  }

  const user = await prisma.user_table.findFirst({
    where: {
      user_username: registerName,
    },
    select: {
      user_username: true,
      user_id: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const teamMemberProfile = await prisma.alliance_member_table.findFirst({
    where: {
      alliance_member_user_id: user?.user_id,
    },
    select: {
      alliance_member_is_active: true,
    },
  });

  if (!teamMemberProfile?.alliance_member_is_active) {
    redirect("/login");
  }

  return (
    <main className="max-w-full min-h-screen flex flex-col items-center justify-start p-2 pt-10">
      <RegisterPage referralLink={registerName} />
    </main>
  );
};

export default Page;
