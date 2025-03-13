"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  handleGetControlNotification,
  handleUpdateControlNotification,
  handleUpdatePackageNotification,
} from "@/services/notification/member";
import { Label } from "@radix-ui/react-label";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type AdminNotificationForm = {
  startAmount: string;
  endAmount: string;
};

const AdminPackageNotificationPage = () => {
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<AdminNotificationForm>({
    defaultValues: {
      startAmount: "",
      endAmount: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isControlNotificationOn, setIsControlNotificationOn] =
    useState<boolean>(false);

  const onSubmit = async (data: AdminNotificationForm) => {
    setIsSubmitting(true);

    try {
      await handleUpdatePackageNotification({
        startAmount: Number(data.startAmount),
        endAmount: Number(data.endAmount),
      });

      reset();

      toast({
        title: "Package Notification Updated",
        description: "Package Notification has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error Updating Package Notification",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTurnOffNotification = async (value: boolean) => {
    try {
      await handleUpdateControlNotification({
        message: value ? "START" : "STOP",
      });

      setIsControlNotificationOn(value);

      toast({
        title: `Notification Turned ${value ? "ON" : "OFF"}`,
        description: `Notification has been turned ${value ? "ON" : "OFF"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error Turning Off Notification",
      });
    }
  };

  useEffect(() => {
    const fetchControlNotification = async () => {
      try {
        const data = await handleGetControlNotification();
        setIsControlNotificationOn(data === "START" ? true : false);
      } catch (error) {
        toast({
          title: "Error Fetching Control Notification",
        });
      }
    };
    fetchControlNotification();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Package Notification</h2>
      <div className="flex gap-2 items-center">
        <Label>Control Notification</Label>
        <Switch
          checked={isControlNotificationOn}
          onCheckedChange={handleTurnOffNotification}
        />
        <span className="text-sm font-medium">
          {isControlNotificationOn ? "ON" : "OFF"}
        </span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 flex flex-col gap-4"
      >
        {/* Start Amount */}
        <Input
          {...register("startAmount", { required: true })}
          placeholder="Start Amount"
          type="number"
        />
        {errors.startAmount && (
          <span className="text-red-500">Start Amount is required</span>
        )}

        {/* End Amount */}
        <Input
          {...register("endAmount", { required: true })}
          placeholder="End Amount"
          type="number"
        />
        {errors.endAmount && (
          <span className="text-red-500">End Amount is required</span>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="card"
          className="rounded-md"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
};

export default AdminPackageNotificationPage;
