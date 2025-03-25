"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const HeroBanner = () => {
  return (
    <section
      id="home"
      className="relative h-[100vh] sm:h-[100vh] w-full flex flex-col xl:pt-20 bg-black overflow-hidden bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/7315bcb8-01d2-4705-687b-d83eccd4d500/public)] bg-cover bg-center"
    >
      <div className="relative flex flex-col md:flex-row items-center justify-around w-full h-full px-8">
        {/* Left Side - Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex flex-col justify-center items-center xl:items-start text-center xl:text-left w-auto gap-8"
        >
          <div className="space-y-2">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-2xl md:text-4xl lg:text-5xl font-extrabold font-airstrike tracking-widest drop-shadow-md"
            >
              LEADING THE WAY
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white text-2xl md:text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight tracking-widest drop-shadow-md"
            >
              IN CRYPTOCURRENCY
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white text-2xl md:text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight drop-shadow-md"
            >
              TO THE FUTURE.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-2xl md:text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight drop-shadow-lg"
            >
              ELEVATING VISIONARIES
            </motion.p>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-2xl md:text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight drop-shadow-lg">
              TO MILLIONAIRES WITH
            </p>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-2xl md:text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight drop-shadow-lg">
              UNMATCHED INNOVATION
            </p>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-2xl md:text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight drop-shadow-lg">
              AND UNWAVERING TRUST!
            </p>
          </div>

          <div>
            <p className="text-white text-xl lg:text-3xl font-extralight font-ethnocentric tracking-widest uppercase">
              Led by:
            </p>
            <div className="flex flex-row gap-6">
              <p className="text-white text-xl lg:text-5xl font-light font-ethnocentric tracking-[0.25em]">
                ANGELICA
              </p>
              <p className="text-white text-xl lg:text-5xl font-light font-ethnocentric tracking-[0.25em]">
                SINAMBAL
              </p>
            </div>
          </div>
          <div className="w-full">
            <Link href="/login">
              <Button
                className="w-full max-w-sm lg:max-w-full text-white font-extralight font-ethnocentric tracking-[0.05em] text-md lg:text-2xl rounded-md h-12 px-0"
                variant="outlinev2"
              >
                Login
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-4 w-full">
            <Separator className="flex-1" />
            <span className="text-white">OR</span>
            <Separator className="flex-1" />
          </div>

          <div className="w-full">
            <a
              href="https://apkfilelinkcreator.cloud/uploads/Elevate Global v1.apk"
              download="Elevate_Global_v1.apk"
              className="w-full cursor-pointer"
            >
              <Button
                className="w-full max-w-sm lg:max-w-full text-white font-extralight font-ethnocentric tracking-[0.05em] text-md lg:text-2xl rounded-md h-12 px-0"
                variant="outlinev2"
              >
                Download Elevate App
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Right Side - Image Section */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="hidden relative w-full max-w-6xl xl:flex justify-center items-end h-full bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/75953815-c805-4e78-5566-85a23c23ec00/public)] bg-no-repeat bg-contain bg-center z-10"
        >
          {/* Gradient Blur */}
          <div className="absolute bottom-10 w-full h-full bg-gradient-to-r from-cyan-300 to-cyan-900 rounded-full blur-[500px] opacity-50 z-0 animate-pulse"></div>

          {/* Hero Image */}
          <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl w-full min-h-[300px] lg:min-h-[500px] relative z-20">
            <Image
              src="https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/bfc510a8-3dc4-4d1d-3bc6-6ce6eb33fa00/public"
              alt="Hero Banner"
              layout="responsive"
              priority
              quality={100}
              width={2000}
              height={2000}
              className="w-full h-auto object-contain"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroBanner;
