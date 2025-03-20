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
      id="packages"
      className="relative min-h-screen h-full w-full flex flex-col  font-ethnocentric bg-black text-white bg-[url('/landing/primaryBackground.png')] bg-cover bg-center py-20 px-10"
    >
      <h2 className="text-6xl md:text-7xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest italic drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
        PACKAGES
      </h2>
      <div className="flex items-center justify-center">
        {Packages.map((pkg, index) => (
          <Image
            key={index}
            src={pkg.url}
            alt={pkg.alt}
            width={1000}
            height={1000}
            quality={80}
          />
        ))}
      </div>
      <h2 className="text-6xl md:text-5xl text-white text-center mb-4 font-black font-airstrike tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
        SAFE & SECURE TRANSACTIONS
      </h2>
      <h2 className="text-6xl md:text-7xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
        GET YOUR MONEY BACK
      </h2>
      <h2 className="text-6xl md:text-7xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
        GUARANTEED. WITHDRAWALS
      </h2>
      <h2 className="text-6xl md:text-7xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest ">
        HAPPEN DAILY AT ELEVATE!
      </h2>
    </section>
  );
};

export default PackageSection;
