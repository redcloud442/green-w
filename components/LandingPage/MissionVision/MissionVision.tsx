import Image from "next/image";

const MissionVision = () => {
  return (
    <section className="relative min-h-screen w-full flex flex-col items-center gap-10 justify-center bg-black text-white pt-10 bg-[url(https://imagedelivery.net/vwrXTORU06toqN4y_4Gwgw/7315bcb8-01d2-4705-687b-d83eccd4d500/public)] bg-cover bg-center border-2">
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
      <div className="relative w-full min-h-screen h-full bg-[url(/landing/MissionVisionLayout.png)] bg-cover  flex justify-center items-end">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 w-full justify-around items-end lg:justify-center lg:items-center h-auto lg:h-[100vh]  ">
          {/* Mission Block */}
          <div className="text-white p-6 flex flex-col items-center justify-center col-span-1">
            <h2 className="text-4xl lg:text-6xl text-black text-center mb-8 font-black font-airstrike tracking-wide drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">
              MISSION
            </h2>
            <p className="text-md lg:text-3xl w-full max-w-3xl text-justify text-black tracking-widest">
              TO EMPOWER INDIVIDUALS BY PROVIDING A SECURE AND RELIABLE
              INVESTMENT PLATFORM FUELD BY EXPERT-DRIVEN ONLINE CRYPTO TRADING.
              ELEVATE IS COMMITED TO LEVERAGING THE DYNAMIC WORLD OF
              CRYPTOCURRENCY TO DELIVER COSINSTENT AND GUARANTEDED RETURNS WHILE
              FOSTERING FINANCIAL LITERACY, TRANSPARENCY, AND LOGNG TERM
              PROSPERITY FOR OUR INVESTORS.
            </p>
          </div>

          <div className="text-white p-6 flex flex-col items-center justify-centercol-span-1">
            <h2 className="text-4xl lg:text-6xl text-black text-center mb-8 font-black font-airstrike tracking-wide italic drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">
              VISION
            </h2>
            <p className="text-md lg:text-3xl w-full max-w-3xl text-justify text-black tracking-widest">
              TO EMPOWER INDIVIDUALS BY PROVIDING A SECURE AND RELIABLE
              INVESTMENT PLATFORM FUELD BY EXPERT-DRIVEN ONLINE CRYPTO TRADING.
              ELEVATE IS COMMITED TO LEVERAGING THE DYNAMIC WORLD OF
              CRYPTOCURRENCY TO DELIVER COSINSTENT AND GUARANTEDED RETURNS WHILE
              FOSTERING FINANCIAL LITERACY, TRANSPARENCY, AND LOGNG TERM
              PROSPERITY FOR OUR INVESTORS.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionVision;
