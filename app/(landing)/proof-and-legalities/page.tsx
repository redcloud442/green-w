import Insights from "@/components/LandingPage/Insights/Insights";
import Proofandlegalities from "@/components/LandingPage/Proofandlegalities/Proofandlegalities";
import Proofofpayouts from "@/components/LandingPage/Proofofpayouts/Proofofpayouts";

const page = () => {
  return (
    <>
      <Proofandlegalities />
      <Proofofpayouts />
      <Insights />
    </>
  );
};

export default page;
