"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const Insights = () => {
  const articles = [
    {
      title: "Article 1",
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/d34542fc-8f5e-4c1e-6eaa-bdc27f466200/public",
      href: "https://orangemagazine.ph/2025/angelica-sinambal-from-struggles-to-success-a-journey-of-perseverance-and-financial-independence/",
      alt: "Article 1",
    },
    {
      title: "Article 2",
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/db0d91a7-2c01-4424-7022-5806a8ccd400/public",
      href: "https://www.manilatimes.net/2025/02/03/tmt-newswire/angelica-sinambal-rising-from-the-ashes/2048601",
      alt: "Article 2",
    },
    {
      title: "Article 3",
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/8eb9d6db-e989-43cc-ee38-f8abf1629300/public",
      href: "https://manilastandard.net/spotlight/314553601/angelica-sinambal-the-journey-of-a-fighter-from-survival-to-success.html",
      alt: "Article 3",
    },
    {
      title: "Article 4",
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/6ff5bbd3-cbd3-4ddd-4e4c-07c71f6dce00/public",
      href: "https://www.dotdailydose.net/2025/02/02/angelica-sinambal-a-story-of-resilience-and-success/",
      alt: "Article 4",
    },
    {
      title: "Article 5",
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/321c9996-f05a-4530-92ea-25654ee4d100/public",
      href: "https://www.manilatimes.net/2025/02/03/tmt-newswire/angelica-sinambal-rising-from-the-ashes/2048601",
      alt: "Article 5",
    },
    {
      title: "Article 6",
      url: "https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/963ddae8-b6f6-4f9c-1930-8ce10af1bf00/public",
      href: "https://nextfeatureph.com/angelica-sinambal-the-journey-of-a-fighter-from-survival-to-success/",
      alt: "Article 6",
    },
  ];

  return (
    <section className="w-full min-h-screen h-full bg-black p-10 bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/7315bcb8-01d2-4705-687b-d83eccd4d500/public)] bg-cover bg-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="w-full flex flex-col items-center text-center"
      >
        <h1 className="text-3xl md:text-5xl text-center lg:text-start font-extrabold font-airstrike tracking-widest drop-shadow-md text-cyan-300">
          CEO INSIGHTS:
        </h1>
        <h1 className="text-3xl md:text-5xl text-center lg:text-start font-extrabold font-airstrike tracking-widest drop-shadow-md text-cyan-300">
          FEATURED ARTICLES & INTERVIEWS:
        </h1>
      </motion.div>

      {/* Flexbox Layout (2x2) */}
      <div className="flex flex-wrap justify-center items-center gap-6 mt-10">
        {articles.slice(0, 6).map((article, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            viewport={{ once: true }}
            className="relative flex flex-col items-center justify-center space-y-10 p-4 gap-y-10 rounded-lg w-full sm:w-[48%] group"
          >
            <Link href={article.href} target="_blank" rel="noopener noreferrer">
              <div className="relative w-full flex justify-center items-center overflow-hidden">
                <div className="absolute inset-0 bg-gray-700 opacity-0 group-hover:opacity-70 transition-opacity duration-300 rounded-lg"></div>

                <p className="absolute text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Click here to redirect
                </p>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={article.url}
                    alt={article.alt}
                    width={600}
                    height={600}
                    className="rounded-lg transition-transform duration-300"
                  />
                </motion.div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Insights;
