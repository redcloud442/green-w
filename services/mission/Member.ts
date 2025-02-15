import { MissionData } from "@/utils/types";

export const handleGetMission = async () => {
  const response = await fetch("/api/v1/mission", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();

  if (!response.ok) {
    return data;
  }

  return data as MissionData;
};
