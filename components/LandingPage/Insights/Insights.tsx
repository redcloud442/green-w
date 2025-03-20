import Image from "next/image";
import Link from "next/link";

const Insights = () => {
  const articles = [
    {
      title: "Article 1",
      url: "/landing/article/article1.png",
      href: "https://orangemagazine.ph/2025/angelica-sinambal-from-struggles-to-success-a-journey-of-perseverance-and-financial-independence/",
      alt: "Article 1",
    },
    {
      title: "Article 2",
      url: "/landing/article/article2.png",
      href: "https://www.manilatimes.net/2025/02/03/tmt-newswire/angelica-sinambal-rising-from-the-ashes/2048601",
      alt: "Article 2",
    },
    {
      title: "Article 3",
      url: "/landing/article/article3.png",
      href: "https://manilastandard.net/spotlight/314553601/angelica-sinambal-the-journey-of-a-fighter-from-survival-to-success.html",
      alt: "Article 3",
    },
    {
      title: "Article 4",
      url: "/landing/article/article4.png",
      href: "https://www.dotdailydose.net/2025/02/02/angelica-sinambal-a-story-of-resilience-and-success/",
      alt: "Article 4",
    },
    {
      title: "Article 5",
      url: "/landing/article/article5.png",
      href: "https://www.manilatimes.net/2025/02/03/tmt-newswire/angelica-sinambal-rising-from-the-ashes/2048601",
      alt: "Article 5",
    },
    {
      title: "Article 6",
      url: "/landing/article/article6.png",
      href: "https://nextfeatureph.com/angelica-sinambal-the-journey-of-a-fighter-from-survival-to-success/",
      alt: "Article 6",
    },
  ];

  return (
    <section className="w-full min-h-screen h-full bg-black p-10 bg-[url(/landing/primaryBackground.png)] bg-cover bg-center">
      <div className="w-full flex flex-col items-center text-center">
        <h1 className="text-cyan-300 text-5xl font-extrabold font-airstrike tracking-widest drop-shadow-md">
          CEO INSIGHTS:
        </h1>
        <h1 className="text-cyan-300 text-5xl font-extrabold font-airstrike tracking-widest drop-shadow-md">
          FEATURED ARTICLES & INTERVIEWS:
        </h1>
      </div>

      {/* Flexbox Layout (2x2) */}
      <div className="flex flex-wrap justify-center items-center gap-6 mt-10">
        {articles.slice(0, 6).map((article, index) => (
          <div
            key={index}
            className="relative flex flex-col items-center justify-center space-y-10 p-4 gap-y-10 rounded-lg w-full sm:w-[48%] group"
          >
            <Link href={article.href} target="_blank" rel="noopener noreferrer">
              <div className="relative w-full flex justify-center items-center overflow-hidden">
                <div className="absolute inset-0 bg-gray-700 opacity-0 group-hover:opacity-70 transition-opacity duration-300 rounded-lg"></div>

                <p className="absolute text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Click here to redirect
                </p>

                <Image
                  src={article.url}
                  alt={article.alt}
                  width={600}
                  height={600}
                  className="hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Insights;
