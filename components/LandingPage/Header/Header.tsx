"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [currentSection, setCurrentSection] = useState("");

  useEffect(() => {
    setCurrentSection("");

    const handleScroll = () => {
      setIsDark(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]); // ✅ Now resets when pathname changes

  const handleScrollToSection = (id: string) => {
    if (pathname !== "/") {
      router.push("/");
      setTimeout(() => {
        scrollToSection(id);
      }, 500);
      scrollToSection(id);
    } else {
      scrollToSection(id);
    }
  };

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setCurrentSection(id);
    }
  };

  const NavigationMenu = [
    { name: "Home", href: "home" },
    { name: "About", href: "about" },
    { name: "Earning Process", href: "earning-process" },
    { name: "Packages", href: "packages" },
    { name: "More Info", href: "more-info" },
    { name: "Proof and Legalities", href: "/proof-and-legalities" },
    { name: "FAQ", href: "/faq" },
  ];

  return (
    <section
      className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-start p-10 transition-all duration-300 bg-transparent`}
    >
      <div
        className={`text-3xl gap-10 flex font-ethnocentric w-full max-w-xs transition-colors duration-300 ${
          isDark ? "text-cyan-700" : "text-white"
        }`}
      >
        {NavigationMenu.map((item) =>
          item.href.startsWith("/") ? (
            // ✅ External navigation to other pages
            <Link
              href={item.href}
              className={`transition-colors duration-300 cursor-pointer ${
                pathname === item.href
                  ? isDark
                    ? "text-cyan-500 underline underline-offset-4 decoration-cyan-500 decoration-2"
                    : "text-sky-400 underline underline-offset-4 decoration-sky-400 decoration-2"
                  : isDark
                    ? "text-cyan-500"
                    : "text-white"
              }`}
              key={item.name}
            >
              {item.name}
            </Link>
          ) : pathname !== "/" ? (
            // ✅ If on another route, navigate back to `/` before scrolling
            <Link
              href={"/"}
              className={`transition-colors duration-300 cursor-pointer ${
                currentSection === item.href
                  ? isDark
                    ? "text-cyan-500 underline underline-offset-4 decoration-cyan-500 decoration-2"
                    : "text-sky-400 underline underline-offset-4 decoration-sky-400 decoration-2"
                  : isDark
                    ? "text-cyan-500"
                    : "text-white"
              }`}
              onClick={() => handleScrollToSection(item.href)}
              key={item.name}
            >
              {item.name}
            </Link>
          ) : (
            // ✅ Smooth scroll if already on `/`
            <p
              className={`transition-colors duration-300 cursor-pointer ${
                currentSection === item.href
                  ? isDark
                    ? "text-cyan-500 underline underline-offset-4 decoration-cyan-500 decoration-2"
                    : "text-sky-400 underline underline-offset-4 decoration-sky-400 decoration-2"
                  : isDark
                    ? "text-cyan-500"
                    : "text-white"
              }`}
              onClick={() => handleScrollToSection(item.href)}
              key={item.name}
            >
              {item.name}
            </p>
          )
        )}
      </div>
      <div className="flex items-start justify-center">
        <Link href="/login">
          <Image
            src="/app-logo.png"
            alt="Elevate Global"
            width={180}
            height={180}
            className="object-contain cursor-pointer"
          />
        </Link>
      </div>
    </section>
  );
};

export default Header;
