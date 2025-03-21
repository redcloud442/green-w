"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const PackageSection = () => {
  const Packages = [
    {
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/9c69b513-e598-4348-98b4-9babd77a2c00/public",
      alt: "Starter Package",
    },
    {
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/2ddce9ed-1a75-4244-8be7-d0eb480dbd00/public",
      alt: "Peak Package",
    },
  ];

  return (
    <section
      id="packages"
      className="relative min-h-screen h-full w-full flex flex-col font-ethnocentric bg-black text-white bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/7315bcb8-01d2-4705-687b-d83eccd4d500/public)] bg-cover bg-center pt-20"
    >
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-5xl md:text-6xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest italic drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]"
      >
        PACKAGES
      </motion.h2>

      <div className="flex flex-col lg:flex-row items-center justify-center">
        {Packages.map((pkg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: index * 0.2 }}
            viewport={{ once: true }}
            className="w-full md:w-1/2 lg:w-1/2"
          >
            <Image
              src={pkg.url}
              alt={pkg.alt}
              width={1000}
              height={1000}
              quality={80}
              className="w-full"
            />
          </motion.div>
        ))}
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
        className="text-lg md:text-3xl lg:text-5xl text-white text-center mb-4 font-black font-airstrike tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]"
      >
        SAFE & SECURE TRANSACTIONS
      </motion.h2>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        viewport={{ once: true }}
        className="text-xl md:text-4xl lg:text-7xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]"
      >
        GET YOUR MONEY BACK
      </motion.h2>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        viewport={{ once: true }}
        className="text-xl md:text-4xl lg:text-7xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]"
      >
        GUARANTEED. WITHDRAWALS
      </motion.h2>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        viewport={{ once: true }}
        className="text-xl md:text-4xl lg:text-7xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest"
      >
        HAPPEN DAILY AT ELEVATE!
      </motion.h2>
    </section>
  );
};

export default PackageSection;
