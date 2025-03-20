const EarningProcess = () => {
  const earningProcessSteps = [
    {
      step: 1,
      title: "REGISTER",
      description: (
        <>
          Create an account to register using the link provided by{" "}
          <span className="text-cyan-300 font-bold uppercase">Elevate</span>.
        </>
      ),
    },
    {
      step: 2,
      title: "DEPOSIT",
      description: (
        <>
          Deposit your investment using the{" "}
          <span className="text-cyan-300 font-bold">MODE OF PAYMENT</span>{" "}
          provided by Elevate.
        </>
      ),
    },
    {
      step: 3,
      title: "AVAIL",
      description: "Choose a package to avail:",
      subSteps: [
        {
          step: "1.)",
          title: () => (
            <>
              <span className="text-cyan-300 font-extrabold">
                Starter Package
              </span>
            </>
          ),
          description: (
            <>
              Earn <span className="text-cyan-300 font-extrabold">25%</span> in
              just <span className="text-cyan-300 font-bold">8</span> days.
            </>
          ),
        },
        {
          step: "2.)",
          title: () => (
            <>
              <span className="text-cyan-300 font-extrabold">Peak Package</span>
            </>
          ),
          description: (
            <>
              Earn <span className="text-cyan-300 font-extrabold">65%</span> in
              just <span className="text-cyan-300 font-bold">15</span> days.
            </>
          ),
        },
      ],
    },
    {
      step: 4,
      title: "CLAIM",
      description: (
        <>
          Once your chosen package has matured, you can{" "}
          <span className="text-cyan-300 font-bold uppercase">claim</span> your
          earnings.
        </>
      ),
    },
  ];

  return (
    <section
      id="earning-process"
      className="relative min-h-screen h-full lg:min-h-screen w-full flex flex-col font-ethnocentric bg-black text-white bg-[url('/landing/earningProcessBg.png')] bg-fixed bg-cover bg-center  pt-10 px-10"
    >
      {/* Title */}
      <h2 className="text-6xl md:text-7xl text-cyan-300 text-center mb-4 font-black font-airstrike tracking-widest drop-shadow-[2px_2px_4px_rgba(0,0,0,0.10)]">
        EARNING PROCESS
      </h2>
      <p className="text-white text-center text-xl md:text-4xl font-extralight tracking-widest mb-16">
        HERE&apos;S AN EASY AND FAST WAY TO EARN AT ELEVATE
      </p>

      <div className="flex justify-center items-center gap-10 w-full min-h-[60vh]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 justify-between items-start w-full">
          {earningProcessSteps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-start"
            >
              <div className="flex justify-start items-center w-full gap-4 max-w-md">
                <h3 className="text-6xl font-extrabold text-cyan-300 italic mb-2">
                  {step.step}
                </h3>
                <h4 className="text-5xl font-bold tracking-widest">
                  {step.title}
                </h4>
              </div>
              <p className="text-4xl mt-2 w-full max-w-sm uppercase tracking-widest">
                {step.description}
              </p>

              {/* Sub Steps (for "Avail") */}
              {step.subSteps && (
                <ul className="mt-4 text-left space-y-8">
                  {step.subSteps.map((subStep, subIndex) => (
                    <li
                      key={subIndex}
                      className="text-4xl font-extralight w-full max-w-sm"
                    >
                      <span className="text-cyan-300 font-extrabold">
                        {subStep.step}
                      </span>{" "}
                      <span className="font-bold">
                        {typeof subStep.title === "string"
                          ? subStep.title
                          : subStep.title()}
                      </span>{" "}
                      - {subStep.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EarningProcess;
