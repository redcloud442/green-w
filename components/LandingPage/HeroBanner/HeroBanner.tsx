import Image from "next/image";
import Header from "../Header/Header";

const HeroBanner = () => {
  return (
    <section className="relative h-[90vh] w-full flex flex-col bg-stone-950 overflow-hidden bg-[url(/landing/primaryBackground.png)] bg-cover bg-center">
      <Header />

      <div className="relative flex flex-col md:flex-row items-center justify-between w-full  h-full px-8">
        {/* Left Side - Text Content */}
        <div className="flex flex-col justify-center items-start text-left w-full gap-32">
          <div>
            <h1 className="text-white text-4xl md:text-6xl font-extrabold font-airstrike tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">
              LEADING THE WAY
            </h1>
            <h1 className="text-white text-4xl md:text-6xl font-extrabold font-airstrike leading-tight tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">
              IN CRYPTOCURRENCY
            </h1>
            <h1 className="text-white text-4xl md:text-6xl font-extrabold font-airstrike leading-tight drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">
              TO THE FUTURE.
            </h1>

            {/* Blue Gradient Text */}
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-3xl md:text-6xl font-extrabold font-airstrike leading-tight drop-shadow-[2px_2px_6px_rgba(0,0,0,0.7)]">
              ELEVATING VISIONARIES
            </p>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-3xl md:text-6xl font-extrabold font-airstrike leading-tight drop-shadow-[2px_2px_6px_rgba(0,0,0,0.7)]">
              TO MILLIONAIRES WITH
            </p>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-3xl md:text-6xl font-extrabold font-airstrike leading-tight drop-shadow-[2px_2px_6px_rgba(0,0,0,0.7)]">
              UNMATCHED INNOVATION
            </p>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-3xl md:text-6xl font-extrabold font-airstrike leading-tight drop-shadow-[2px_2px_6px_rgba(0,0,0,0.7)]">
              AND UNWAVERING TRUST!
            </p>
          </div>

          <div>
            <p className="text-white text-4xl font-extralight font-ethnocentric tracking-widest uppercase">
              Led by:
            </p>
            <div className="flex flex-row gap-12">
              <p className="text-white text-6xl font-light font-ethnocentric tracking-[0.30em]">
                ANGELICA
              </p>
              <p className="text-white text-6xl font-light font-ethnocentric tracking-[0.30em]">
                SINAMBAL
              </p>
            </div>
          </div>
        </div>

        <div className="relative w-full flex h-full">
          <Image
            src="/landing/bgGradientCircle.png"
            alt="Hero Banner"
            width={2000}
            height={2000}
            className="z-10 object-contain absolute bottom-24 right-4"
          />
          <Image
            src="/landing/heroBanner.png"
            alt="Hero Banner"
            width={600}
            height={600}
            priority
            quality={100}
            className="z-10 object-contain absolute -bottom-10 right-32"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
