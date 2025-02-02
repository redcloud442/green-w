export const handleAddPreferredWithdrawal = async (Params: {
  accountName: string;
  accountNumber: string;
  bankName: string;
}) => {
  const response = await fetch(`/api/v1/user/preferred-bank`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(Params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to add preferred withdrawal");
  }

  return data;
};
