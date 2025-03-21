"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const Proofandlegalities = () => {
  return (
    <section className="w-full min-h-auto lg:min-h-screen h-full bg-black bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/7315bcb8-01d2-4705-687b-d83eccd4d500/public)] bg-cover bg-center">
      <div className="w-full h-full flex flex-col items-center justify-start pt-48 pb-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl text-cyan-300 text-center lg:text-start font-black font-airstrike tracking-widest italic drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]"
        >
          Proof and Legalities
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          viewport={{ once: true }}
          className="w-full h-full flex flex-col items-center justify-start mt-10"
        >
          <h1 className="text-white text-3xl md:text-5xl text-center lg:text-start font-extrabold font-airstrike tracking-widest drop-shadow-md">
            ELEVATE IS DTI REGISTERED
          </h1>

          <Image
            src="https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/a4222e8c-19c3-48b7-4366-057cf6c8d200/public"
            alt="DTI"
            width={1000}
            height={1000}
            className="object-contain"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default Proofandlegalities;
