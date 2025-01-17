export const sendTextMessage = async () => {
  const endpoint = "https://api.itexmo.com/api/broadcast";
  const payload = {
    Email: "cloudred442@gmail.com",
    Password: "Markivor24123!",
    Recipients: ["09453726040"],
    Message: "Test message.",
    ApiCode: "PR-SAMPL123456_ABCDE",
    SenderId: "ITEXMO SMS",
  };

  // Construct headers
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    throw error;
  }
};
