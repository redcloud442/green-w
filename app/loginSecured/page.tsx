import LoginPageSecured from "@/components/LoginPageSecured/page";
import { protectionRegisteredUser } from "@/utils/serversideProtection";
import { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Log in your account",
  description: "Sign in an account",
  openGraph: {
    url: "/loginSecured",
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
      <LoginPageSecured />
    </main>
  );
};
export default Page;
