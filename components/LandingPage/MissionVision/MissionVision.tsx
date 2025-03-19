import Image from "next/image";

const MissionVision = () => {
  return (
    <section className="relative min-h-screen w-full flex flex-col items-center gap-10 justify-center bg-black text-white pt-20 bg-[url(/landing/primaryBackground.png)] bg-cover bg-center">
      {/* Background Image */}

      {/* Top Block: MissionVisionMountain Image */}
      <div className="relative w-full flex justify-center">
        <Image
          src="/landing/MissionVisionMountain.png"
          alt="Mission Vision Mountain"
          quality={80}
          height={500}
          width={500}
          priority
          className="object-contain"
        />
      </div>

      {/* Bottom Block: MissionVisionLayout Image */}
      <div className="relative w-full">
        {/* Background Image */}
        <Image
          src="/landing/MissionVisionLayout.png"
          alt="Mission Vision Layout"
          quality={80}
          width={500}
          height={500}
          className="object-cover w-full h-[80vh]"
        />

        {/* Overlay Text */}
        <div className="absolute inset-0 top-1/4 flex items-start justify-start">
          <div className="grid grid-cols-2 gap-8 w-full ">
            {/* Mission Block */}
            <div className="text-white p-6 flex flex-col items-center justify-center">
              <h2 className="text-6xl text-black text-center mb-8 font-black font-airstrike tracking-wide drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">
                MISSION
              </h2>
              <p className="text-3xl w-full max-w-3xl text-justify text-black tracking-widest">
                TO EMPOWER INDIVIDUALS BY PROVIDING A SECURE AND RELIABLE
                INVESTMENT PLATFORM FUELD BY EXPERT-DRIVEN ONLINE CRYPTO
                TRADING. ELEVATE IS COMMITED TO LEVERAGING THE DYNAMIC WORLD OF
                CRYPTOCURRENCY TO DELIVER COSINSTENT AND GUARANTEDED RETURNS
                WHILE FOSTERING FINANCIAL LITERACY, TRANSPARENCY, AND LOGNG TERM
                PROSPERITY FOR OUR INVESTORS.
              </p>
            </div>

            <div className="text-white p-6 flex flex-col items-center justify-center">
              <h2 className="text-6xl text-black text-center mb-8 font-black font-airstrike tracking-wide italic drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">
                VISION
              </h2>
              <p className="text-3xl w-full max-w-3xl text-justify text-black tracking-widest">
                TO EMPOWER INDIVIDUALS BY PROVIDING A SECURE AND RELIABLE
                INVESTMENT PLATFORM FUELD BY EXPERT-DRIVEN ONLINE CRYPTO
                TRADING. ELEVATE IS COMMITED TO LEVERAGING THE DYNAMIC WORLD OF
                CRYPTOCURRENCY TO DELIVER COSINSTENT AND GUARANTEDED RETURNS
                WHILE FOSTERING FINANCIAL LITERACY, TRANSPARENCY, AND LOGNG TERM
                PROSPERITY FOR OUR INVESTORS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionVision;
