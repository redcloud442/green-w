import Image from "next/image";
import Header from "../Header/Header";

const HeroBanner = () => {
  return (
    <section className="h-screen w-full bg-stone-950">
      <div className="absolute inset-0 h-full w-full">
        <Image
          src="/landing/primaryBackground.png"
          alt="Background"
          quality={80}
          fill
          priority
          className="object-cover"
        />
      </div>
      <Header />
    </section>
  );
};

export default HeroBanner;
