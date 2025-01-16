import BankingEmailNotificationTemplate, {
  BankingEmailNotificationTemplateProps,
} from "@/components/EmailTemplate.tsx/EmailTemplate";
import { applyRateLimitMember } from "@/utils/function";
import { createClientServerSide } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    applyRateLimitMember(userData.user.id);

    const {
      to,
      subject,
      accountHolderName,
      accountNumber,
      transactionDetails,
      message,
      greetingPhrase,
      closingPhrase,
      signature,
    } = await req.json();

    const emailProps: BankingEmailNotificationTemplateProps = {
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
        ? "<help@elevevateglobal.app>"
        : "<help@portfolio-glorioso.site>";

    const { data, error } = await resend.emails.send({
      from: `Formsly Team ${domain}`,
      to: to,
      subject: subject,
      react: BankingEmailNotificationTemplate(emailProps),
    });

    if (error) {
      console.error(error);
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
