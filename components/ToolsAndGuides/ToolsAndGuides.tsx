"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { Button } from "../ui/button";

const ToolsAndGuides = () => {
  const toolsAndGuides = [
    {
      title: "Referral Income",
      description: "Paano mag-refer ng account",
      image: "/tools-and-guides/referral-income.png",
    },
    {
      title: "Network Income",
      description: "Paano mag-refer ng account",
      image: "/tools-and-guides/network-income.png",
    },
    {
      title: "Paano Gumawa ng Bybit Account",
      description: "Paano gumawa ng Bybit account",
      image: "/tools-and-guides/paano-gumawa-ng-bybit-account.png",
    },
    {
      title: "Paano i-Check ang Dashboard",
      description: "Paano i-check ang dashboard",
      image: "/tools-and-guides/paano-icheck-ang-dashboard.png",
    },
    {
      title: "Paano Kung-Kunin ang Referral Link",
      description: "Paano kung-kunin ang referral link",
      image: "/tools-and-guides/paano-kunin-ang-referral-link.png",
    },
    {
      title: "Paano Mag-Activate ng Package",
      description: "Paano mag-activate ng package",
      image: "/tools-and-guides/paano-mag-activate-ng-package.png",
    },
    {
      title: "Paano Mag-Register ng Account",
      description: "Paano mag-register ng account",
      image: "/tools-and-guides/paano-mag-register-ng-account.png",
    },
    {
      title: "Paano Mag-Pasok ng Investment o Capital",
      description: "Paano mag-pasok ng investment o capital",
      image: "/tools-and-guides/paano-magpasok-ng-investment-o-capital.png",
    },
    {
      title: "Paano Palitan ang Password",
      description: "Paano palitan ang password",
      image: "/tools-and-guides/paano-palitan-ang-password.png",
    },
    {
      title: "Paano Pumunta sa Message-Request",
      description: "Paano pumunta sa message-request",
      image: "/tools-and-guides/paano-pumunta-sa-message-request.png",
    },
    {
      title: "Paano Icheck ang Payin",
      description: "Paano i-check ang payin",
      image: "/tools-and-guides/paanp-icheck-ang-payin.png",
    },
  ];
  const downloadLink = "/tools-and-guides/ToolsGuidesElevate.pdf";

  return (
    <div className="flex flex-col items-center justify-start sm:justify-center min-h-screen h-full mb-12  py-12 px-4">
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

              <div className="bg-white shadow-md rounded-lg overflow-hidden p-4 hover:shadow-2xl transition-shadow w-full max-w-md sm:max-w-lg">
                <Image
                  src={item.image}
                  alt={item.title}
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
  );
};

export default ToolsAndGuides;
