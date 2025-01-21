import {
  handleBatchPackageNotification,
  handleUpdateManyPackageMemberConnection,
} from "@/app/actions/package/packageAction";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  batchMessageNotification,
  batchPackageNotification,
} from "@/services/Package/Admin";
import { package_notification_logs } from "@prisma/client";
import { useState } from "react";
import ReactDOMServer from "react-dom/server";
import BankingEmailNotificationTemplate from "../EmailTemplate.tsx/EmailTemplate";

type Props = {
  packageNotification: package_notification_logs[];
};

const AdminUserNotifyModal = ({ packageNotification }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const chunkArray = (
    array: {
      username: string | null;
      email: string | null;
      activeMobile: string | null;
      packageConnectionId: string;
      teamMemberId: string | null;
    }[],
    chunkSize: number
  ) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const limit = 100; // Fetch 100 records per page
      let page = 1;
      let totalFetched = 0;
      let totalCount = 0; // Initialize totalCount
      let batchEmails: {
        to: string[];
        from: string;
        subject: string;
        html: React.ReactNode;
      }[] = [];

      let batchUpdate: {
        packageConnectionId: string;
        teamMemberId: string;
      }[] = [];

      let number: string[] = [];

      do {
        // Fetch paginated data from the server
        const response = await handleBatchPackageNotification(page, limit);
        const { userCreds } = response;

        totalCount = response.totalCount || totalCount;
        if (userCreds && userCreds.length > 0) {
          const activeEmails = userCreds
            .filter(
              (user) =>
                user.user_email &&
                user.user_active_mobile &&
                user.team_member_id &&
                user.package_connection_id
            )
            .map((user) => ({
              username: user.user_username,
              email: user.user_email,
              activeMobile: user.user_active_mobile,
              packageConnectionId: user.package_connection_id,
              teamMemberId: user.team_member_id,
            }));

          if (activeEmails.length > 0) {
            for (const batch of chunkArray(activeEmails, 100)) {
              batchEmails.push({
                to: batch.map((user) => user.email || ""),
                from: "Elevate Team <info@help.elevateglobal.app>",
                subject: "Package Notification",
                html: ReactDOMServer.renderToStaticMarkup(
                  <BankingEmailNotificationTemplate
                    greetingPhrase={`Hello ${batch[0].username || "User"}`}
                    message="Do not forget to claim your package tomorrow"
                    closingPhrase="Thank you"
                    signature="Elevate Team"
                  />
                ),
              });

              const formattedNumbers = batch.map((user) =>
                user.activeMobile ? user.activeMobile.replace(/^0/, "+63") : ""
              );

              number.push(...formattedNumbers);

              batchUpdate.push(
                ...batch.map((user) => ({
                  packageConnectionId: user.packageConnectionId,
                  teamMemberId: user.teamMemberId || "",
                }))
              );
            }
          } else {
          }

          totalFetched += userCreds.length;
          page++;
        } else {
          break;
        }
      } while (totalFetched < totalCount);

      if (batchEmails.length > 0) {
        await batchPackageNotification({ batchData: batchEmails });
      }

      if (number.length > 0) {
        await batchMessageNotification({
          number,
          message: "Hello, Do not forget to claim your package tomorrow !",
        });
      }

      if (batchUpdate.length > 0) {
        await handleUpdateManyPackageMemberConnection(batchUpdate);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="card"
          type="button"
          disabled={packageNotification?.length > 0}
          className="rounded-md w-full sm:w-auto"
          onClick={() => setOpen(true)}
        >
          Package Notification
        </Button>
      </DialogTrigger>
      <DialogContent type="table" className="overflow-x-auto">
        <DialogHeader>
          <DialogTitle>This is only use 1 per day</DialogTitle>
          <DialogDescription className="text-lg">
            Once Used, all users will be notified through email, text, and
            in-app notification for their package claim.
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full flex-col gap-6">
          <Button
            variant="card"
            disabled={loading}
            type="button"
            className="w-full rounded-md"
            onClick={handleConfirm}
          >
            {loading ? "Loading..." : "Confirm"}
          </Button>
        </div>
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserNotifyModal;
