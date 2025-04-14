import { toast } from "@/hooks/use-toast";
import { createClientSide } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

const CompanyAllotedFunds = () => {
  const supabase = createClientSide();
  const [companyAllotedFunds, setCompanyAllotedFunds] = useState<number>(0);

  useEffect(() => {
    const fetchInitialFunds = async () => {
      const { data, error } = await supabase
        .schema("packages_schema")
        .from("package_company_funds_table")
        .select("package_company_funds_amount")
        .single();

      if (data) {
        setCompanyAllotedFunds(data.package_company_funds_amount);
      } else {
        toast({
          title: "Error fetching initial funds",
          description: error?.message,
        });
      }
    };

    fetchInitialFunds();
  }, []);

  return (
    <div className="flex justify-center  gap-2">
      <div className="flex flex-col bg-gray-200/50 p-2 rounded-xl text-center">
        <p className="text-md sm:text-lg font-extralight">
          Company Alloted Funds
        </p>
        <p className="text-md sm:text-lg font-extrabold">
          ₱{" "}
          {companyAllotedFunds.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    </div>
  );
};

export default CompanyAllotedFunds;
