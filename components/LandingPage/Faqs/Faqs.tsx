import { Button } from "@/components/ui/button";
import Image from "next/image";

const Faqs = () => {
  const faqs = [
    {
      url: "/GUIDES/2.png",
      alt: "FAQ 1",
    },
    {
      url: "/GUIDES/5.png",
      alt: "FAQ 2",
    },
    {
      url: "/GUIDES/1.png",
      alt: "FAQ 3",
    },
    {
      url: "/GUIDES/10.png",
      alt: "FAQ 4",
    },
  ];
  const downloadLink = "/GUIDES/Tools-and-Guides-Elevate.pdf";

  return (
    <section className="w-full min-h-screen h-full space-y-8 bg-black pt-48 p-10 bg-[url(/landing/primaryBackground.png)] bg-cover bg-center">
      <div className="w-full flex flex-col items-center text-center">
        <h1 className="text-cyan-300 text-5xl font-extrabold font-airstrike tracking-widest drop-shadow-md">
          FAQS
        </h1>
      </div>
      <div className="flex flex-col items-center">
        <a href={downloadLink} download>
          <Button
            className="w-full sm:w-auto px-6 py-3 text-black text-2xl font-bold font-ethnocentric tracking-widest rounded-none 
          bg-cyan-300  hover:translate-y-1 transition-all
          underline shadow-[0_5px_0px_0px_rgba(0,0,255,0.8)] "
          >
            CLICK HERE TO DOWNLOAD GUIDES
          </Button>
        </a>
      </div>
      <div className="flex flex-wrap justify-center items-center gap-y-20 mt-10">
        {faqs.slice(0, 4).map((faq, index) => (
          <div
            key={index}
            className="relative flex flex-col items-center justify-center space-y-10 p-4 gap-y-10 rounded-lg w-full sm:w-[48%] group"
          >
            <div className="relative w-full flex justify-center items-center overflow-hidden">
              <Image src={faq.url} alt={faq.alt} width={400} height={400} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Faqs;
