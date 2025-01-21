import BankingEmailNotificationTemplate, {
  BankingEmailNotificationTemplateProps,
} from "@/components/EmailTemplate.tsx/EmailTemplate";
import { rateLimit } from "@/utils/redis/redis";
import { createClientServerSide } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_123");

export async function POST(req: NextRequest) {
  try {
    const supabaseClient = await createClientServerSide();
    const { data: userData } = await supabaseClient.auth.getUser();

    if (!userData.user)
      return NextResponse.json({
        error: "not_authenticated",
        description:
          "The user does not have an active session or is not authenticated",
      });

    const isAllowed = await rateLimit(`rate-limit:${userData.user.id}`, 5, 60);

    if (!isAllowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const {
      to,
      subject,
      accountHolderName,
      accountBank,
      accountType,
      accountNumber,
      transactionDetails,
      message,
      greetingPhrase,
      closingPhrase,
      signature,
    } = await req.json();

    const emailProps: BankingEmailNotificationTemplateProps = {
      accountBank,
      accountType,
      accountHolderName,
      accountNumber,
      transactionDetails,
      message,
      greetingPhrase,
      closingPhrase,
      signature,
    };

    const domain =
      process.env.NODE_ENV === "production"
        ? "<info@help.elevateglobal.app>"
        : "<help@portfolio-glorioso.site>";

    const { data, error } = await resend.emails.send({
      from: `Elevate Team ${domain}`,
      to: to,
      subject: subject,
      react: BankingEmailNotificationTemplate(emailProps),
    });

    if (error) {
      return NextResponse.json(error);
    }

    return NextResponse.json({
      message: "Email sent successfully",
      data,
    });
  } catch (e) {
    return NextResponse.json({ error: "Error sending email" });
  }
}
