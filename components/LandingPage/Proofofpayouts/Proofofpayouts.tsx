"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const Proofofpayouts = () => {
  const testimonialLists = [
    {
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/eb5d8f97-3f03-45b0-4efc-872674260000/public",
      alt: "Testimonial 1",
    },
    {
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/093860c1-ddd2-4df4-b848-3b0ada87ac00/public",
      alt: "Testimonial 2",
    },
    {
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/c353ed46-5cf2-4615-88f8-916683131800/public",
      alt: "Testimonial 3",
    },
    {
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/203770a1-06ba-4d65-89a4-e85e1fd0e300/public",
      alt: "Testimonial 4",
    },
  ];

  return (
    <section className="w-full min-h-auto lg:min-h-screen h-full bg-black border-2 border-r-8 border-b-8 border-blue-500 p-4 space-y-8 bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/7315bcb8-01d2-4705-687b-d83eccd4d500/public)] bg-cover bg-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="w-full h-full flex flex-col items-center justify-start border-b-2 py-8 border-blue-500"
      >
        <h1 className="text-3xl md:text-5xl text-center lg:text-start font-extrabold font-airstrike tracking-widest drop-shadow-md text-cyan-300">
          Proof of Payouts
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 justify-items-center">
        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="w-full h-full flex flex-col items-center justify-center col-span-1"
        >
          <iframe
            src="https://customer-omhuc66adavmtiu2.cloudflarestream.com/4ca7d6e65565935312ddcefa27f557ac/iframe"
            className="w-full h-full object-cover bg-transparent"
            allow="autoplay; fullscreen; muted"
            allowFullScreen
          ></iframe>
        </motion.div>

        {/* Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="w-full h-full flex flex-col items-center justify-start col-span-1 space-y-4"
        >
          {testimonialLists.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Image
                src={testimonial.url}
                alt={testimonial.alt}
                width={1000}
                height={1000}
                className="object-cover"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Proofofpayouts;
