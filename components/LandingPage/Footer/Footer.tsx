import Image from "next/image";

const Footer = () => {
  return (
    <div className="relative w-full h-full bg-transparent pt-24">
      <Image
        src="/landing/footerBackground.png"
        alt="Footer Background"
        width={1920}
        height={1080}
        quality={80}
        className="absolute bottom-0 left-0 max-w-none w-full object-cover bg-transparent"
      />
    </div>
  );
};

export default Footer;
