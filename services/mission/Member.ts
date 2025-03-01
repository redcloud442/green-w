import { MissionData } from "@/utils/types";
import { package_member_connection_table } from "@prisma/client";

export const handleGetMission = async () => {
  const response = await fetch("/api/v1/mission", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch mission");
  }

  return data as MissionData;
};

export const handlePostClaimMission = async () => {
  const response = await fetch("/api/v1/mission", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch member");
  }

  return data as {
    missionData: MissionData;
    packageData: package_member_connection_table & {
      package_color: string;
    };
  };
};
