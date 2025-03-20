import Header from "@/components/LandingPage/Header/Header";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      {children}
      {/* <Footer /> */}
    </>
  );
}
