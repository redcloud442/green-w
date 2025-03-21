"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const MissionVision = () => {
  return (
    <section className="relative min-h-screen w-full flex flex-col items-center gap-10 justify-center bg-black text-white pt-10 bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/7315bcb8-01d2-4705-687b-d83eccd4d500/public)] bg-cover bg-center border-2">
      {/* Top Block: MissionVisionMountain Image */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative w-full flex justify-center"
      >
        <Image
          src="https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/6f7d0774-7552-4735-ca28-29c298950a00/public"
          alt="Mission Vision Mountain"
          quality={80}
          height={500}
          width={500}
          priority
          className="object-contain"
        />
      </motion.div>

      {/* Bottom Block: MissionVisionLayout Image */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.1 }}
        viewport={{ once: true }}
        className="relative w-full min-h-screen h-full bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/b234c216-10ae-4e8d-2e07-44a5ce089b00/public)] bg-cover flex justify-center items-end sm:items-center"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 w-full justify-around items-end xl:justify-center xl:items-center h-auto lg:h-[100vh]">
          {/* Mission Block */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-white p-6 flex flex-col items-center justify-center col-span-1"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl text-black text-center mb-8 font-black font-airstrike tracking-wide drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">
              MISSION
            </h2>
            <p className="text-md md:text-2xl lg:text-3xl w-full max-w-3xl text-justify text-black tracking-widest">
              TO EMPOWER INDIVIDUALS BY PROVIDING A SECURE AND RELIABLE
              INVESTMENT PLATFORM FUELD BY EXPERT-DRIVEN ONLINE CRYPTO TRADING.
              ELEVATE IS COMMITED TO LEVERAGING THE DYNAMIC WORLD OF
              CRYPTOCURRENCY TO DELIVER COSINSTENT AND GUARANTEDED RETURNS WHILE
              FOSTERING FINANCIAL LITERACY, TRANSPARENCY, AND LOGNG TERM
              PROSPERITY FOR OUR INVESTORS.
            </p>
          </motion.div>

          {/* Vision Block */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-white p-6 flex flex-col items-center justify-center col-span-1"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl text-black text-center mb-8 font-black font-airstrike tracking-wide italic drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">
              VISION
            </h2>
            <p className="text-md md:text-2xl lg:text-3xl w-full max-w-3xl text-justify text-black tracking-widest">
              TO EMPOWER INDIVIDUALS BY PROVIDING A SECURE AND RELIABLE
              INVESTMENT PLATFORM FUELD BY EXPERT-DRIVEN ONLINE CRYPTO TRADING.
              ELEVATE IS COMMITED TO LEVERAGING THE DYNAMIC WORLD OF
              CRYPTOCURRENCY TO DELIVER COSINSTENT AND GUARANTEDED RETURNS WHILE
              FOSTERING FINANCIAL LITERACY, TRANSPARENCY, AND LOGNG TERM
              PROSPERITY FOR OUR INVESTORS.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default MissionVision;
