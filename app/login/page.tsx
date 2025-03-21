import LoginPage from "@/components/loginPage/loginPage";
import { protectionRegisteredUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Log In Your Account ",
  description:
    "Log in to your account to access personalized services and updates",
  openGraph: {
    title: "Log In to Your Account | Stay Connected",
    description:
      "Sign in to your account and enjoy personalized access to features and updates",
    url: "https://elevateglobal.app/login",
    type: "website",

    images: [
      {
        url: "https://elevateglobal.app/app-logo.png",
        alt: "Log In Now - Access Your Account",
        width: 1200,
        height: 630,
      },
    ],
    siteName: "Elevate Global",
  },
};

const Page = async () => {
  const result = await protectionRegisteredUser();

  if (result?.redirect) {
    redirect("/");
  }

  return (
    <main className="max-w-full min-h-screen flex flex-col items-center justify-center">
      <div className="absolute inset-0 -z-10 h-full w-full">
        <Image
          src="/assets/bg-primary.png"
          alt="Background"
          quality={80}
          fill
          priority
          className="object-cover"
        />
      </div>
      <LoginPage />
    </main>
  );
};
export default Page;
