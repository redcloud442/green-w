"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { handleUpdatePackageNotification } from "@/services/notification/member";
import { useState } from "react";
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

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Package Notification</h2>
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
