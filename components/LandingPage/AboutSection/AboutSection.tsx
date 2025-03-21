"use client";

import { motion } from "framer-motion";

const AboutSection = () => {
  return (
    <section id="about" className="min-h-screen h-full w-full bg-slate-100">
      <div className="container mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-5xl md:text-6xl text-black text-center mb-8 font-black font-airstrike tracking-wide drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]"
        >
          ABOUT
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center"
        >
          <div className="flex flex-col items-center justify-center tracking-widest font-ethnocentric">
            <p className="text-md lg:text-2xl text-black text-center mb-8 w-full max-w-7xl">
              ANGELICA SINAMBAL IS THE VISIONARY LEADER BEHIND ELEVATE, A
              PLATFORM EMPOWERING INDIVIDUALS THROUGH DIGITAL INCOME
              OPPORTUNITIES
            </p>
            <p className="text-md lg:text-2xl text-black text-center mb-8 w-full max-w-6xl">
              WITH OVER A DECADE OF EXPERIENCE ABROAD, SHE DISCOVERED
              CRYPTOCURRENCY TRADING IN 2012 AND MASTERED IT DESPITE PERSONAL
              AND FINANCIAL HARDSHIPS.
            </p>

            <p className="text-md lg:text-2xl text-black text-center mb-8 w-full max-w-5xl">
              IN 2023, SHE FOUNDED ELEVATE TO HELP PEOPLE ACHIEVE FINANCIAL
              STABILITY. NOW IN 2025 SHE CONTINUES TO EXPAND ITS IMPACT WHILE
              MANAGING MULTIPLE BUSINESSES, INSPIRING OTHERS TO TAKE CONTROL OF
              THEIR FINANCIAL FUTURE.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/2093fd39-83c0-4a5b-20eb-00fbf1747000/public)] bg-contain bg-no-repeat bg-center"
        >
          <div className="flex flex-col items-center justify-center">
            <iframe
              src="https://customer-omhuc66adavmtiu2.cloudflarestream.com/6f55213c31f565eeaa2620bd6faa8791/iframe"
              width="100%"
              height="580"
              allow="autoplay; fullscreen"
              allowFullScreen
            ></iframe>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
