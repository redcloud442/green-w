import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AlignJustify } from "lucide-react";
import Link from "next/link";

type BurgerProps = {
  NavigationMenu: { name: string; href: string }[];
  pathname: string;
  currentSection: string;
  handleScrollToSection: (section: string) => void;
  isDark: boolean;
};

const Burger = ({
  NavigationMenu,
  pathname,
  currentSection,
  handleScrollToSection,
  isDark,
}: BurgerProps) => {
  return (
    <Sheet>
      <SheetTrigger className="z-50 xl:hidden block">
        <AlignJustify
          className={` z-50 h-10 w-10 ${
            isDark ? "text-cyan-400" : "text-white"
          }`}
        />
      </SheetTrigger>
      <SheetContent className="bg-stone-950 border-none">
        <SheetHeader>
          <SheetTitle className="text-white font-black font-airstrike text-3xl pb-10">
            Elevate Global
          </SheetTitle>
          <SheetDescription className="flex flex-col justify-start items-start gap-4 font-airstrike text-xl">
            {NavigationMenu.map((item) =>
              item.href.startsWith("/") ? (
                <SheetClose asChild key={item.name}>
                  <Link
                    href={item.href}
                    className={`transition-colors duration-300 cursor-pointer ${
                      pathname === item.href
                        ? "text-cyan-500 underline underline-offset-4 decoration-cyan-500 decoration-2"
                        : "text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                </SheetClose>
              ) : pathname !== "/" ? (
                <SheetClose asChild key={item.name}>
                  <Link
                    href={"/"}
                    className={`transition-colors duration-300 cursor-pointer ${
                      currentSection === item.href
                        ? "text-cyan-500 underline underline-offset-4 decoration-cyan-500 decoration-2"
                        : "text-white"
                    }`}
                    onClick={() => handleScrollToSection(item.href)}
                  >
                    {item.name}
                  </Link>
                </SheetClose>
              ) : (
                <SheetClose key={item.name}>
                  <p
                    className={`transition-colors duration-300 cursor-pointer ${
                      currentSection === item.href
                        ? "text-cyan-500 underline underline-offset-4 decoration-cyan-500 decoration-2"
                        : "text-white"
                    }`}
                    onClick={() => handleScrollToSection(item.href)}
                  >
                    {item.name}
                  </p>
                </SheetClose>
              )
            )}
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

export default Burger;
