"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const MoreInformation = () => {
  const moreInformation = [
    {
      title: "WHEN IS THE WITHDRAWAL AVAILABLE?",
      answer: () => (
        <>
          <span>- OUR WITHDRAWAL REQUEST</span> IS AVAILBLE{" "}
          <span className="text-blue-500 underline-offset-2 underline font-bold">
            EVERYDAY 24/7
          </span>
          .
        </>
      ),
    },
    {
      title: "WHAT IS THE MINIMUM AND MAXIMUM INVESTMENT AMOUNTS?",
      answer: () => (
        <>
          <span>
            - OUR MININMUM IS{" "}
            <span className="text-blue-500 underline-offset-2 underline font-bold">
              300 PESOS
            </span>{" "}
            AND OUR MAXIMUM IS{" "}
            <span className="text-blue-500 underline-offset-2 underline font-bold">
              200,000 PESOS
            </span>
            .
          </span>
        </>
      ),
    },
    {
      title: "WHEN CAN WE DEPOSIT OUR INVESTMENT?",
      answer: () => (
        <>
          <span>
            - YOU CAN DEPOSIT YOUR INVESTMENT{" "}
            <span className="text-blue-500 underline-offset-2 underline font-bold">
              EVERYDAY 24/7
            </span>
            .
          </span>
        </>
      ),
    },
  ];

  return (
    <section
      id="more-info"
      className="relative min-h-screen h-full w-full flex flex-col font-ethnocentric bg-black text-white bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/7315bcb8-01d2-4705-687b-d83eccd4d500/public)] bg-cover bg-center pt-20"
    >
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative flex flex-col items-center lg:items-start justify-start px-20"
      >
        <h2 className="text-4xl md:text-6xl text-white text-start font-black font-airstrike tracking-widest italic drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
          MORE
        </h2>
        <h2 className="text-4xl md:text-6xl text-cyan-300 text-start mb-4 font-black font-airstrike tracking-widest italic drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
          INFORMATION
        </h2>
      </motion.div>

      {/* FAQ Items */}
      <div className="relative w-full h-auto lg:h-[40vh] bg-stone-100 p-10 flex flex-col justify-around items-center lg:items-start px-10">
        {moreInformation.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            viewport={{ once: true }}
            className="text-black font-ethnocentric space-y-4"
          >
            <h3 className="text-lg lg:text-3xl font-bold w-full max-w-full lg:text-start text-center lg:max-w-4xl tracking-widest ">
              {item.title}
            </h3>
            <p className="text-md lg:text-2xl font-sans font-semibold lg:text-start text-center w-full max-w-full lg:max-w-3xl pb-8">
              {item.answer()}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Footer Statement */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        viewport={{ once: true }}
        className="relative w-full h-auto px-10 text-center lg:text-start text-stone-300 py-4"
      >
        <div className="flex items-start justify-center lg:justify-start">
          <Image
            src="/app-logo.png"
            alt="Elevate Global"
            width={400}
            height={400}
            className="w-1/4 lg:w-1/6"
          />
        </div>
        <p className="text-xl lg:text-4xl">
          ELEVATE UNLOCK YOUR MISSION, ACHIEVE YOUR
        </p>
        <p className="text-xl lg:text-4xl">MISSIONS</p>
        <p className="text-xl lg:text-4xl">
          SUCCESS STARTS WITHIN YOUR ELEVATE ACCOUNT
        </p>
        <p className="text-xl lg:text-4xl">DISCOVER YOUR MISSION,</p>
        <p className="text-xl lg:text-4xl">
          COMPLETE IT, AND OPEN DOORS TO UNLIMITED
        </p>
        <p className="text-xl lg:text-4xl">OPPORTUNITIES</p>
      </motion.div>

      {/* Decorative Bottom Image */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        viewport={{ once: true }}
        className="-bottom-32 right-20 absolute xl:block hidden"
      >
        <Image
          src="https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/ff869d2e-f040-4a6b-da2c-7ea096bfd700/public"
          alt="Elevate Global"
          width={600}
          height={600}
          quality={100}
        />
      </motion.div>
    </section>
  );
};

export default MoreInformation;
