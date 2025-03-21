import AboutSection from "@/components/LandingPage/AboutSection/AboutSection";
import EarningProcess from "@/components/LandingPage/EarningProcess/EarningProcess";
import HeroBanner from "@/components/LandingPage/HeroBanner/HeroBanner";
import MissionVision from "@/components/LandingPage/MissionVision/MissionVision";
import MoreInformation from "@/components/LandingPage/MoreInformation/MoreInformation";
import PackageSection from "@/components/LandingPage/PackageSection/PackageSection";

const page = () => {
  return (
    <>
      <HeroBanner />
      <AboutSection />
      <MissionVision />
      <EarningProcess />
      <PackageSection />
      <MoreInformation />
    </>
  );
};

export default page;
