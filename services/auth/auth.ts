import { createClientSide } from "@/utils/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import bcryptjs from "bcryptjs";
import { z } from "zod";

const registerUserSchema = z.object({
  activeMobile: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || val === "" || /^0\d{10}$/.test(val),
      "Active Mobile must start with '0' and contain exactly 11 digits."
    ),
  activeEmail: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val?.trim() === "" ? null : val))
    .refine(
      (val) => val === null || z.string().email().safeParse(val).success,
      "Invalid email address"
    ),
  userName: z.string().min(6),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  referalLink: z.string().min(2),
  url: z.string().min(2),
});

export const createTriggerUser = async (params: {
  activeMobile: string;
  activeEmail: string;
  userName: string;
  firstName: string;
  lastName: string;
  password: string;
  referalLink?: string;
  url: string;
  botField: string;
  captchaToken: string;
}) => {
  const {
    userName,
    password,
    referalLink,
    url,
    firstName,
    lastName,
    activeMobile,
    activeEmail,
    botField,
    captchaToken,
  } = params;
  const supabase = createClientSide();

  const validate = registerUserSchema.safeParse(params);

  const checkUserNameResult = await checkUserName({ userName });

  if (!checkUserNameResult.success) {
    throw new Error("Username already taken.");
  }

  if (!validate.success) {
    throw new Error(validate.error.message);
  }

  const formatUsername = userName + "@gmail.com";

  const hashedPassword = await bcryptjs.hash(password, 10);

  const { error: userError } = await supabase.auth.signUp({
    email: formatUsername,
    password,
    options: {
      captchaToken,
    },
  });

  if (userError) throw userError;

  const userParams = {
    userName,
    email: formatUsername,
    activeMobile,
    activeEmail,
    password: hashedPassword,
    firstName,
    lastName,
    referalLink,
    url,
    botField,
  };

  const response = await fetch(`/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userParams),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || userError || "An error occurred");
  }

  return { success: true };
};

export const loginValidation = async (
  supabaseClient: SupabaseClient,
  params: {
    userName: string;
    password: string;
    captchaToken: string;
  }
) => {
  const { userName, password, captchaToken } = params;

  const formattedUserName = userName + "@gmail.com";

  const response = await fetch(`/api/v1/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message);
  }

  const { error: signInError } = await supabaseClient.auth.signInWithPassword({
    email: formattedUserName,
    password,
    options: {
      captchaToken,
    },
  });

  if (signInError) throw signInError;

  return;
};

export const checkUserName = async (params: { userName: string }) => {
  const response = await fetch(`/api/v1/auth?userName=${params.userName}`, {
    method: "GET",
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || "An error occurred");
  }

  return responseData;
};

export const changeUserPassword = async (params: {
  email: string;
  userId: string;
  password: string;
}) => {
  const { email, password, userId } = params;

  const inputData = {
    email,
    clientpass: password,
  };

  const response = await fetch(`/api/user/` + userId, {
    method: "PUT",
    body: JSON.stringify(inputData),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      throw new Error("Unexpected HTML response from the server.");
    }

    try {
      await response.json();
    } catch (e) {
      throw new Error("An unexpected error occurred.");
    }
  }

  const result = await response.json();

  if (!result) throw new Error();

  return result;
};

export const handleSignInAdmin = async (params: {
  userName: string;
  password: string;
}) => {
  const response = await fetch(`/api/v1/auth/loginSecured`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Invalid username or password");
  }

  return response;
};
