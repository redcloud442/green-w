import Image from "next/image";

const MoreInformation = () => {
  const moreInformation = [
    {
      title: "WHEN IS THE WITHDRAWAL AVAILABLE?",
      answer: () => (
        <>
          <span>- OUR WITHDRAWAL REQUEST</span> IS AVAILBLE{" "}
          <span className="text-blue-500 underline-offset-2 underline font-bold">
            EVERYDAY 24/7.
          </span>
        </>
      ),
    },
    {
      title: "WHAT IS THE MINIMUM AND MAXIMUM INVESTMENT AMOUNTS?",
      answer: () => (
        <>
          <span>
            - OUR MININMUM IS{" "}
            <span className="text-blue-500 underline-offset-2 underline font-bold">
              300 PESOS
            </span>{" "}
            AND OUR MAXIMUM IS{" "}
            <span className="text-blue-500 underline-offset-2 underline font-bold">
              50,000 PESOS
            </span>
            .
          </span>
        </>
      ),
    },
    {
      title: "WHEN CAN WE DEPOSIT OUR INVESTMENT?",
      answer: () => (
        <>
          <span>
            - YOU CAN DEPOSIT YOUR INVESTMENT{" "}
            <span className="text-blue-500 underline-offset-2 underline font-bold">
              EVERYDAY 24/7.
            </span>
          </span>
        </>
      ),
    },
  ];

  return (
    <section className="relative min-h-[70vh] h-full w-full flex flex-col font-ethnocentric bg-black text-white bg-[url('/landing/primaryBackground.png')] bg-cover bg-center pt-20">
      <div className="relative flex flex-col items-start justify-start px-20">
        <h2 className="text-6xl md:text-7xl text-white text-start font-black font-airstrike tracking-widest italic drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
          MORE
        </h2>
        <h2 className="text-6xl md:text-7xl text-cyan-300 text-start mb-4 font-black font-airstrike tracking-widest italic drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
          INFORMATION
        </h2>
      </div>
      <div className="relative w-full h-[40vh] bg-stone-100 p-10 flex flex-col justify-around items-start px-10">
        {moreInformation.map((item, index) => (
          <div className="text-black font-ethnocentric space-y-4" key={index}>
            <h3 className="text-3xl font-bold w-full max-w-4xl tracking-widest">
              {item.title}
            </h3>
            <p className="text-2xl font-sans font-semibold w-full max-w-3xl">
              {item.answer()}
            </p>
          </div>
        ))}
      </div>
      <div className="relative w-full h-[50vh] px-10  text-stone-300">
        <div className="flex items-start justify-start">
          <Image
            src="/app-logo.png"
            alt="Elevate Global"
            width={400}
            height={400}
          />
        </div>
        <p className="text-4xl md:text-4xl">
          ELEVATE UNLOCK YOUR MISSION, ACHIEVE YOUR
        </p>
        <p className="text-4xl md:text-4xl">MISSIONS</p>
        <p className="text-xl md:text-4xl">
          SUCCESS STARTS WITHIN YOUR ELEVATE ACCOUNT
        </p>
        <p className="text-xl md:text-4xl">DISCOVER YOUR MISSION,</p>
        <p className="text-xl md:text-4xl">
          COMPLETE IT, AND OPEN DOORS TO UNLIMITED
        </p>
        <p className="text-xl md:text-4xl">OPPORTUNITIES</p>
      </div>
      <Image
        src="/landing/moreInfoBg.png"
        alt="Elevate Global"
        width={500}
        height={400}
        className="absolute bottom-0 right-20"
      />
    </section>
  );
};

export default MoreInformation;
