"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

const ToolsAndGuides = () => {
  const [logoVisible, setLogoVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLogoVisible(false), 3000); // 3-second fade effect
    return () => clearTimeout(timer);
  }, []);

  const toolsAndGuides = [
    {
      title: "",
      description: "",
      video: "LOW MB INTRO.mp4",
    },
    {
      title: "",
      description: "",
      video: "/GUIDES/video2.mp4",
    },
    {
      alt: "DTI",
      image: "/GUIDES/DTI.png",
    },
    {
      alt: "Guide 1",
      image: "/GUIDES/1.png",
    },

    {
      alt: "Guide 2",
      image: "/GUIDES/2.png",
    },

    {
      alt: "Guide 3",
      image: "/GUIDES/3.png",
    },
    {
      alt: "Guide 4",
      image: "/GUIDES/4.png",
    },
    {
      alt: "Guide 5",
      image: "/GUIDES/5.png",
    },
    {
      alt: "Guide 6",
      image: "/GUIDES/6.png",
    },
    {
      alt: "Guide 7",
      image: "/GUIDES/7.png",
    },
    {
      alt: "Guide 8",
      image: "/GUIDES/8.png",
    },
    {
      alt: "Guide 9",
      image: "/GUIDES/9.png",
    },
    {
      alt: "Guide 10",
      image: "/GUIDES/10.png",
    },
    {
      alt: "Guide 11",
      image: "/GUIDES/11.png",
    },
    {
      alt: "Guide 12",
      image: "/GUIDES/12.png",
    },
    {
      alt: "Guide 13",
      image: "/GUIDES/13.png",
    },
    {
      alt: "Guide 14",
      image: "/GUIDES/14.png",
    },
    {
      alt: "Guide 15",
      image: "/GUIDES/15.png",
    },
    {
      alt: "Guide 16",
      image: "/GUIDES/16.png",
    },
    {
      alt: "Guide 17",
      image: "/GUIDES/17.png",
    },
    {
      alt: "Guide 18",
      image: "/GUIDES/18.png",
    },
    {
      alt: "Guide 19",
      image: "/GUIDES/19.png",
    },
    {
      alt: "FB PAGE PFP",
      image: "/GUIDES/FB PAGE PFP.png",
    },

    {
      alt: "FB-PAGE-COVER",
      image: "/GUIDES/FB-PAGE-COVER.png",
    },
    {
      alt: "LOGO WITH BACKGROUND",
      image: "/GUIDES/LOGO WITH BACKGROUND.jpg",
    },

    {
      alt: "NEW LOGO",
      image: "/GUIDES/new-logo.png",
    },
  ];

  const downloadLink = "/GUIDES/Tools-and-Guides-Elevate.pdf";

  return (
    <div className="relative min-h-screen h-full">
      {logoVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-cyan-300-300/80 z-50">
          <Image
            src="/GUIDES/new-logo.png"
            alt="Logo"
            width={200}
            height={200}
            className="animate-fadeInOut"
          />
        </div>
      )}

      {!logoVisible && (
        <div className="flex flex-col items-center justify-start sm:justify-center min-h-screen h-full mb-12 py-12 px-4">
          <div className="absolute top-4 right-4">
            <a href={downloadLink} download>
              <Button variant="card" className="text-black w-full sm:w-auto">
                Download Guide
              </Button>
            </a>
          </div>
          <Carousel className="w-full max-w-4xl">
            <CarouselContent>
              {toolsAndGuides.map((item, index) => (
                <CarouselItem
                  key={index}
                  className="w-full flex flex-col justify-center items-center"
                >
                  <div className="mt-4 text-center">
                    <h3 className="text-lg sm:text-2xl font-semibold text-white">
                      {item.title}
                    </h3>
                  </div>

                  <div className="bg-transparent border-2 rounded-lg overflow-hidden p-4 hover:shadow-2xl transition-shadow w-full max-w-md sm:max-w-lg">
                    {item.video ? (
                      <video
                        controls
                        className="rounded-lg w-full"
                        autoPlay={true}
                        playsInline={true}
                        muted={true}
                        style={{ objectFit: "cover" }}
                      >
                        <source src={item.video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <Image
                        src={item.image ?? ""}
                        alt={item.alt ?? ""}
                        className="rounded-lg"
                        width={500}
                        height={500}
                        sizes="(max-width: 768px) 300px, 500px"
                        style={{
                          objectFit: "cover",
                          height: "auto",
                          width: "100%",
                        }}
                      />
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className="flex justify-between w-full mt-4">
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </Carousel>
        </div>
      )}
    </div>
  );
};

export default ToolsAndGuides;
