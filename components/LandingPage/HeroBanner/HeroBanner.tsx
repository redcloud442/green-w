import { Button } from "@/components/ui/button";
import Image from "next/image";

const HeroBanner = () => {
  return (
    <section
      id="home"
      className="relative h-[100vh] w-full flex flex-col bg-black overflow-hidden bg-[url(/landing/primaryBackground.png)] bg-cover bg-center"
    >
      <div className="relative flex flex-col md:flex-row items-center justify-around w-full h-full px-8">
        {/* Left Side - Text Content */}
        <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left w-auto gap-8">
          <div>
            <h1 className="text-white text-4xl lg:text-5xl font-extrabold font-airstrike tracking-widest drop-shadow-md">
              LEADING THE WAY
            </h1>
            <h1 className="text-white text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight tracking-widest drop-shadow-md">
              IN CRYPTOCURRENCY
            </h1>
            <h1 className="text-white text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight drop-shadow-md">
              TO THE FUTURE.
            </h1>

            {/* Blue Gradient Text */}
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight drop-shadow-lg">
              ELEVATING VISIONARIES
            </p>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight drop-shadow-lg">
              TO MILLIONAIRES WITH
            </p>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight drop-shadow-lg">
              UNMATCHED INNOVATION
            </p>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-4xl lg:text-5xl font-extrabold font-airstrike leading-tight drop-shadow-lg">
              AND UNWAVERING TRUST!
            </p>
          </div>

          <div>
            <p className="text-white text-xl lg:text-3xl font-extralight font-ethnocentric tracking-widest uppercase">
              Led by:
            </p>
            <div className="flex flex-row gap-6">
              <p className="text-white text-3xl lg:text-5xl font-light font-ethnocentric tracking-[0.25em]">
                ANGELICA
              </p>
              <p className="text-white text-3xl lg:text-5xl font-light font-ethnocentric tracking-[0.25em]">
                SINAMBAL
              </p>
            </div>
          </div>
          <div className="w-full">
            <Button
              className="w-full text-white font-extralight font-ethnocentric tracking-[0.25em] text-2xl rounded-md h-12"
              variant="outline"
            >
              Download Elevateglobal App
            </Button>
          </div>
        </div>

        <div className="hidden relative w-full md:w-1/2 h-full xl:flex justify-center items-end bg-[url(/landing/bgBackdrop.png)] bg-no-repeat bg-contain bg-center z-10">
          {/* Gradient Circle - Positioned Behind Background */}
          <div className="hidden xl:block xl:absolute bottom-10 w-full h-full bg-gradient-to-r from-cyan-300 to-cyan-900 rounded-full blur-[1400px] opacity-60 z-0"></div>

          {/* Hero Section */}
          <div className="w-[500px] hidden xl:block xl:w-[700px] h-auto relative bg-[url(/landing/bgGradientCircle.png)] bg-no-repeat bg-contain bg-center z-20">
            <Image
              src="/landing/heroBanner.png"
              alt="Hero Banner"
              width={2000}
              height={2000}
              priority
              quality={80}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
