export const getEarnings = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user`, {
    method: "GET",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the earnings."
    );
  }

  const { data, preferredWithdrawal } = result;

  return {
    earnings: data,
    preferredWithdrawal: preferredWithdrawal,
  };
};

export const getUserSponsor = async (params: { userId: string }) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/user/sponsor`,
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the earnings."
    );
  }

  const { data } = result;

  return data as {
    user_username: string;
  };
};

export const getReferralData = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/referrals`,
      {
        method: "GET",
      }
    );

    const result = await response.json();

    return result as {
      direct: {
        sum: number;
        count: number;
      };
      indirect: {
        sum: number;
        count: number;
      };
    };
  } catch (e) {
    return { error: "Internal server error" };
  }
};

export const getUserNotification = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/user/notification`,
    {
      method: "GET",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the notification."
    );
  }

  const { teamMemberProfile, userNotification, count } = result;

  return {
    teamMemberProfile,
    userNotification,
    count,
  };
};

export const getUserEarnings = async (params: { userId: string }) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/user/${params.userId}`,
    {
      method: "POST",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the earnings."
    );
  }

  const { userEarningsData } = result;

  return userEarningsData;
};

export const getUserWithdrawalToday = async (params: { userId: string }) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/user/${params.userId}`,
    {
      method: "GET",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the withdrawal."
    );
  }

  const { isWithdrawalToday } = result;

  return isWithdrawalToday;
};

export const getuserTotalEarnings = async (params: { memberId: string }) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/user/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the earnings."
    );
  }

  const { totalEarnings, userEarningsData, userRanking } = result;

  return { totalEarnings, userEarningsData, userRanking };
};

export const getUserNotificationWithLimit = async (params: {
  page: number;
  limit: number;
  teamMemberId: string;
}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/user/notification`,
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "An error occurred while fetching the notification."
    );
  }

  const { data, count } = result;

  return { data, count };
};
