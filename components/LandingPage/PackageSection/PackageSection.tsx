import Image from "next/image";

const PackageSection = () => {
  const Packages = [
    {
      url: "/landing/starter.png",
      alt: "Starter Package",
    },
    {
      url: "/landing/peak.png",
      alt: "Peak Package",
    },
  ];
  return (
    <section
      id="more-info"
      className="relative min-h-screen h-full w-full flex flex-col font-ethnocentric bg-black text-white bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/7315bcb8-01d2-4705-687b-d83eccd4d500/public)] bg-cover bg-center pt-20"
    >
      <h2 className="text-5xl md:text-6xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest italic drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
        PACKAGES
      </h2>
      <div className="flex flex-col lg:flex-row items-center justify-center">
        {Packages.map((pkg, index) => (
          <Image
            key={index}
            src={pkg.url}
            alt={pkg.alt}
            width={1000}
            height={1000}
            quality={80}
            className="w-full lg:w-1/2"
          />
        ))}
      </div>
      <h2 className="text-3xl lg:text-5xl text-white text-center mb-4 font-black font-airstrike tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
        SAFE & SECURE TRANSACTIONS
      </h2>
      <h2 className="text-4xl lg:text-7xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
        GET YOUR MONEY BACK
      </h2>
      <h2 className="text-4xl lg:text-7xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
        GUARANTEED. WITHDRAWALS
      </h2>
      <h2 className="text-4xl lg:text-7xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest ">
        HAPPEN DAILY AT ELEVATE!
      </h2>
    </section>
  );
};

export default PackageSection;
