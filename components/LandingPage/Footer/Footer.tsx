"use client";
import { FacebookIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="relative w-full bg-stone-950 font-ethnocentric">
      <div className="relative z-10 flex flex-col items-center text-center text-white bg-black/60 px-6 py-2 space-y-4">
        {/* Logo */}
        <div className="mb-4 flex flex-col items-center gap-2">
          <Image
            src="/logo.png" // Replace with your actual logo path
            alt="Elevate Global"
            width={100}
            height={50}
            className="object-cover"
          />
          <Link href="/" className="text-md">
            www.elevateglobal.app
          </Link>
        </div>
        <p className="text-md opacity-75">Get in touch with us:</p>
        <Link
          href="https://www.facebook.com/groups/elevateexecutivecommunity"
          target="_blank"
          className="flex flex-row cursor-pointer"
        >
          <FacebookIcon className="w-6 h-6 p-0" />
          acebook
        </Link>
        <p className="text-xs opacity-75">
          &copy; {new Date().getFullYear()} Elevate Global. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
