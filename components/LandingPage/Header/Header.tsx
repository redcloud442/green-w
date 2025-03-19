"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();
  const NavigationMenu = [
    {
      name: "Home",
      href: "/",
    },
    {
      name: "About",
      href: "#about",
    },
    {
      name: "Earning Process",
      href: "#earning-process",
    },
    {
      name: "Packages",
      href: "#packages",
    },
    {
      name: "More Info",
      href: "#more-info",
    },
    {
      name: "Proof and Legalities",
      href: "#proof-and-legalities",
    },
    {
      name: "FAQ",
      href: "#faq",
    },
  ];

  return (
    <section className="fixed top-0 left-0 right-0 z-50 flex justify-between items-start p-10">
      <div className="text-2xl text-white gap-10 flex">
        {NavigationMenu.map((item) => (
          <Link
            className={`${pathname === item.href ? "text-sky-400 underline underline-offset-4 decoration-sky-400 decoration-2" : "text-white"}`}
            href={item.href}
            key={item.name}
          >
            {item.name}
          </Link>
        ))}
      </div>
      <div className="flex items-start justify-center">
        <Image
          src="/app-logo.png"
          alt="Elevate Global"
          width={180}
          height={180}
        />
      </div>
    </section>
  );
};

export default Header;
