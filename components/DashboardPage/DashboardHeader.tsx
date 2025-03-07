"use client";

import { toast } from "@/hooks/use-toast";
import { useUserDashboardEarningsStore } from "@/store/useUserDashboardEarnings";
import { RANK_COLORS } from "@/utils/constant";
import {
  alliance_member_table,
  alliance_referral_link_table,
  user_table,
} from "@prisma/client";
import { Info } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import DashboardGenerateQrCode from "./DashboardDepositRequest/DashboardDepositModal/DashboardGenerateQrCode";

type DashboardHeaderProps = {
  profile: user_table;
  teamMemberProfile: alliance_member_table;
  referal: alliance_referral_link_table;
};

const DashboardHeader = ({
  profile,
  teamMemberProfile,
  referal,
}: DashboardHeaderProps) => {
  const { totalEarnings } = useUserDashboardEarningsStore();

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "Referral link copied to clipboard",
      variant: "success",
    });
  };

  return (
    <div
      className={`flex flex-row fixed sm:fixed w-full sm:min-w-fit sm:max-w-lg justify-between px-1 bg-cardColor/90 py-2 sm:px-2 items-center top-0 sm:top-2 sm:bg-cardColor sm:rounded-tr-lg sm:rounded-br-lg z-50 ${
        totalEarnings?.rank
          ? "sm:py-0 sm:rounded-tr-lg sm:rounded-br-lg"
          : "sm:py-2 sm:rounded-tr-lg sm:rounded-br-lg"
      }`}
    >
      {/* Profile Section */}
      <div className="flex gap-2 justify-center items-center">
        {/* Avatar */}
        <div className="flex items-center justify-center">
          <Avatar className="w-8 h-8 sm:w-12 sm:h-12">
            <AvatarImage src={profile.user_profile_picture ?? ""} />
            <AvatarFallback>
              {profile.user_first_name?.charAt(0).toUpperCase()}
              {profile.user_last_name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info Section */}
        <div className="flex flex-col items-start gap-1">
          {/* Name and Badge */}
          <div className="flex flex-col">
            <div className="flex gap-2 items-center">
              <p className="text-[12px] sm:text-sm font-semibold">
                {profile.user_first_name} {profile.user_last_name}
              </p>
              {totalEarnings?.totalIncomeTag &&
                totalEarnings.totalIncomeTag.length > 0 &&
                totalEarnings.totalIncomeTag.map((tag, index) => (
                  <Badge
                    key={index}
                    className="h-4 sm:h-5 text-[9px] sm:text-xs bg-green-500 text-white cursor-pointer rounded-sm px-2"
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>

          {teamMemberProfile.alliance_member_is_active && (
            <div className="flex items-center gap-1 text-white sm:text-black">
              <p className="text-[10px] sm:text-xs italic text-black">
                Referral:{" "}
              </p>
              <p className="text-[10px] sm:text-xs truncate bg-indigo-400 text-white rounded-xl px-1 max-w-[150px] sm:max-w-[250px]">
                {referal.alliance_referral_link}
              </p>

              <Badge
                onClick={() => handleCopy(referal.alliance_referral_link)}
                className="h-4 sm:h-5 bg-sky-400 text-[9px] sm:text-xs text-white cursor-pointer rounded-sm px-2"
              >
                Copy
              </Badge>
              <DashboardGenerateQrCode url={referal.alliance_referral_link} />
            </div>
          )}
        </div>
      </div>

      {/* Image */}

      <div className="relative ">
        {/* Background Image */}
        <div
          className={`${totalEarnings?.rank ? "absolute right-10 sm:right-14 bottom-10 inset-0 flex items-center justify-center z-50" : "block mr-8 z-50"}`}
        >
          <Popover>
            <PopoverTrigger>
              <Info className="w-5 h-5 sm:w-5 sm:h-5 text-white bg-violet-600 rounded-full cursor-pointer" />
            </PopoverTrigger>
            <PopoverContent className="text-[10px] sm:text-[11px] p-2">
              <p className="font-bold text-center mb-2">By Referrals</p>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 text-left">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-2 py-1">Rank</th>
                      <th className="border border-gray-300 px-2 py-1">
                        Requirement
                      </th>
                      <th className="border border-gray-300 px-2 py-1">
                        Badge
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-semibold">
                        Iron
                      </td>
                      <td className="border text-justify border-gray-300 px-2 py-1">
                        Makakakuha ka ng badge sa pamamagitan ng pag-refer ng
                        hindi bababa sa 3 tao
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {" "}
                        <Image
                          src={`/ranking/iron.png`}
                          alt="ranking"
                          width={800}
                          height={800}
                          quality={100}
                          className="w-12 h-12 object-cover"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-semibold">
                        Bronze
                      </td>
                      <td className="border text-justify border-gray-300 px-2 py-1">
                        Makakakuha ka ng badge sa pamamagitan ng pag-refer ng
                        hindi bababa sa 7 tao
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {" "}
                        <Image
                          src={`/ranking/bronze.png`}
                          alt="ranking"
                          width={800}
                          height={800}
                          quality={100}
                          className="w-12 h-12 object-cover"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-semibold">
                        Silver
                      </td>
                      <td className="border text-justify border-gray-300 px-2 py-1">
                        Makakakuha ka ng badge sa pamamagitan ng pag-refer ng
                        hindi bababa sa 10 tao
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {" "}
                        <Image
                          src={`/ranking/silver.png`}
                          alt="ranking"
                          width={800}
                          height={800}
                          quality={100}
                          className="w-12 h-12 object-cover"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-semibold">
                        Gold
                      </td>
                      <td className="border text-justify border-gray-300 px-2 py-1">
                        Makakakuha ka ng badge sa pamamagitan ng pag-refer ng
                        hindi bababa sa 20 tao
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {" "}
                        <Image
                          src={`/ranking/gold.png`}
                          alt="ranking"
                          width={800}
                          height={800}
                          quality={100}
                          className="w-12 h-12 object-cover"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-semibold">
                        Platinum
                      </td>
                      <td className="border  text-justify border-gray-300 px-2 py-1">
                        Makakakuha ka ng badge sa pamamagitan ng pag-refer ng
                        hindi bababa sa 50 tao
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {" "}
                        <Image
                          src={`/ranking/platinum.png`}
                          alt="ranking"
                          width={800}
                          height={800}
                          quality={100}
                          className="w-12 h-12 object-cover"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border text-justify border-gray-300 px-2 py-1 font-semibold">
                        Emerald
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        Makakakuha ka ng badge sa pamamagitan ng pag-refer ng
                        hindi bababa sa 100 tao
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {" "}
                        <Image
                          src={`/ranking/emerald.png`}
                          alt="ranking"
                          width={800}
                          height={800}
                          quality={100}
                          className="w-12 h-12 object-cover"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-semibold">
                        Ruby
                      </td>
                      <td className="border text-justify border-gray-300 px-2 py-1">
                        Makakakuha ka ng badge sa pamamagitan ng pag-refer ng
                        hindi bababa sa 150 tao
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {" "}
                        <Image
                          src={`/ranking/ruby.png`}
                          alt="ranking"
                          width={800}
                          height={800}
                          quality={100}
                          className="w-12 h-12 object-cover"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-semibold">
                        Sapphire
                      </td>
                      <td className="border text-justify border-gray-300 px-2 py-1">
                        Makakakuha ka ng badge sa pamamagitan ng pag-refer ng
                        hindi bababa sa 200 tao
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {" "}
                        <Image
                          src={`/ranking/sapphire.png`}
                          alt="ranking"
                          width={800}
                          height={800}
                          quality={100}
                          className="w-12 h-12 object-cover"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-semibold">
                        Diamond
                      </td>
                      <td className="border text-justify border-gray-300 px-2 py-1">
                        Makakakuha ka ng badge sa pamamagitan ng pag-refer ng
                        hindi bababa sa 500 tao
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {" "}
                        <Image
                          src={`/ranking/diamond.png`}
                          alt="ranking"
                          width={800}
                          height={800}
                          quality={100}
                          className="w-12 h-12  object-cover"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {totalEarnings?.rank && (
          <div className="relative flex flex-col items-center justify-center">
            <Image
              src={`/ranking/${totalEarnings?.rank}.png`}
              alt="ranking"
              width={800}
              height={800}
              quality={100}
              className="w-20 h-20 object-contain"
            />
            <p
              className="text-[8px] sm:text-[10px] font-bold absolute bottom-1"
              style={{
                textShadow: `1px 1px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white`,
                color: `${RANK_COLORS[totalEarnings?.rank as keyof typeof RANK_COLORS]}`,
              }}
            >
              {totalEarnings?.rank?.toUpperCase() || ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
