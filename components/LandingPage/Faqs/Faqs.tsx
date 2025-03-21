"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";

const Faqs = () => {
  const faqs = [
    {
      url: "/GUIDES/2.png",
      alt: "FAQ 1",
    },
    {
      url: "/GUIDES/5.png",
      alt: "FAQ 2",
    },
    {
      url: "/GUIDES/1.png",
      alt: "FAQ 3",
    },
    {
      url: "/GUIDES/10.png",
      alt: "FAQ 4",
    },
  ];
  const downloadLink = "/GUIDES/Tools-and-Guides-Elevate.pdf";

  return (
    <section className="w-full min-h-screen h-full space-y-8 bg-black pt-48 p-10 bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/7315bcb8-01d2-4705-687b-d83eccd4d500/public)] bg-cover bg-center">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="w-full flex flex-col items-center text-center"
      >
        <h1 className="text-3xl md:text-5xl text-center lg:text-start font-extrabold font-airstrike tracking-widest drop-shadow-md text-cyan-300">
          FAQS
        </h1>
      </motion.div>

      {/* Download Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="flex flex-col items-center"
      >
        <a href={downloadLink} download>
          <Button
            className="w-full sm:w-auto px-1 py-3 text-black text-sm lg:text-2xl font-bold font-ethnocentric tracking-widest rounded-none 
          bg-cyan-300 hover:translate-y-1 transition-all
          underline shadow-[0_5px_0px_0px_rgba(0,0,255,0.8)]"
          >
            CLICK HERE TO DOWNLOAD GUIDES
          </Button>
        </a>
      </motion.div>

      {/* FAQ Images */}
      <div className="flex flex-wrap justify-center items-center gap-y-20 mt-10">
        {faqs.slice(0, 4).map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            viewport={{ once: true }}
            className="relative flex flex-col items-center justify-center space-y-10 p-4 gap-y-10 rounded-lg w-full sm:w-[48%] group"
          >
            <div className="relative w-full flex justify-center items-center overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src={faq.url}
                  alt={faq.alt}
                  width={400}
                  height={400}
                  className="rounded-lg transition-transform duration-300"
                />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Faqs;
