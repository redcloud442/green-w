import Image from "next/image";

const Proofofpayouts = () => {
  const testimonialLists = [
    {
      url: "/landing/testimonials/testimonial1.png",
      alt: "Testimonial 1",
    },
    {
      url: "/landing/testimonials/testimonial2.png",
      alt: "Testimonial 2",
    },
    {
      url: "/landing/testimonials/testimonial3.png",
      alt: "Testimonial 3",
    },
    {
      url: "/landing/testimonials/testimonial4.png",
      alt: "Testimonial 4",
    },
  ];

  return (
    <section className="w-full min-h-screen h-full bg-black border-2 border-r-8 border-b-8 border-blue-500 p-4 space-y-8 bg-[url(/landing/primaryBackground.png)] bg-cover bg-center">
      <div className="w-full h-full flex flex-col items-center justify-start border-b-2 py-8 border-blue-500">
        <h1 className="text-cyan-300 text-5xl font-extrabold font-airstrike tracking-widest drop-shadow-md">
          Proof of Payouts
        </h1>
      </div>
      <div className="grid grid-cols-2 gap-4 justify-items-center">
        <div className="w-full h-full flex flex-col items-center justify-start col-span-1">
          <video
            src="/GUIDES/video2.mp4"
            autoPlay
            muted
            controls
            loop
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-full h-full flex flex-col items-center justify-start col-span-1">
          {testimonialLists.map((testimonial, index) => (
            <Image
              key={index}
              src={testimonial.url}
              alt={testimonial.alt}
              width={1000}
              height={1000}
              className="w-full h-full object-cover"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Proofofpayouts;
