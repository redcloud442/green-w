import Image from "next/image";

const Proofandlegalities = () => {
  return (
    <section className="w-full min-h-screen h-full bg-black bg-[url(/landing/primaryBackground.png)] bg-cover bg-center">
      <div className="w-full h-full flex flex-col items-center justify-start pt-48 pb-10">
        <h1 className="text-cyan-300 text-5xl font-extrabold font-airstrike tracking-widest drop-shadow-md">
          Proof and Legalities
        </h1>
        <div className="w-full h-full flex flex-col items-center justify-start mt-10">
          <h1 className="text-white text-5xl font-extrabold font-airstrike tracking-widest drop-shadow-md">
            ELEVATE IS DTI REGISTERED
          </h1>
          <Image
            src="/landing/dtiLegalities.png"
            alt="DTI"
            width={1000}
            height={1000}
            className="w-1/2"
          />
        </div>
      </div>
    </section>
  );
};

export default Proofandlegalities;
