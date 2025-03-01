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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClientSide } from "@/utils/supabase/client";

import { logError } from "@/services/Error/ErrorLogs";
import { createPackage } from "@/services/Package/Admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { package_table } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import FileUpload from "../ui/dropZone";

type Props = {
  setPackages: Dispatch<SetStateAction<package_table[]>>;
  closeModal: () => void;
};

const PackagesSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),

  packageDescription: z.string().min(1, "Package description is required"),
  packagePercentage: z.string().refine((value) => Number(value) > 0, {
    message: "Percentage must be greater than 0",
  }),
  packageDays: z.string().refine((value) => Number(value) > 0, {
    message: "Days must be greater than 0",
  }),
  packageColor: z
    .instanceof(File)
    .refine((file) => !!file, { message: "File is required" })
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/jpg"].includes(file.type) &&
        file.size <= 12 * 1024 * 1024, // 12MB limit
      { message: "File must be a valid image and less than 12MB." }
    ),
  file: z
    .instanceof(File)
    .refine((file) => !!file, { message: "File is required" })
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/jpg"].includes(file.type) &&
        file.size <= 12 * 1024 * 1024, // 12MB limit
      { message: "File must be a valid image and less than 12MB." }
    ),
});

export type PackagesFormValues = z.infer<typeof PackagesSchema>;

const CreatePackageModal = ({ setPackages, closeModal }: Props) => {
  const supabaseClient = createClientSide();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PackagesFormValues>({
    resolver: zodResolver(PackagesSchema),
    defaultValues: {
      packageName: "",
      packageDescription: "",
      packagePercentage: "",
      packageDays: "",
    },
  });

  const onSubmit = async (data: PackagesFormValues) => {
    const filesToUpload = [
      {
        file: data.file,
        path: `uploads/${Date.now()}_${data.file.name}`,
      },
      {
        file: data.packageColor,
        path: `uploads/${Date.now()}_${data.packageColor.name}`,
      },
    ];

    try {
      // Upload all files concurrently
      const uploadResults = await Promise.all(
        filesToUpload.map(async ({ file, path }) => {
          const { error } = await supabaseClient.storage
            .from("PACKAGE_IMAGES")
            .upload(path, file, { upsert: true });

          if (error) {
            throw new Error(`Failed to upload file: ${file.name}`);
          }

          const publicUrl = `https://content.elevateglobal.app/storage/v1/object/public/PACKAGE_IMAGES/${path}`;

          return { path, publicUrl };
        })
      );

      const packageBanner = uploadResults[0].publicUrl;
      const packageColor = uploadResults[1].publicUrl;

      await createPackage({
        packageName: data.packageName,
        packageDescription: data.packageDescription,
        packagePercentage: data.packagePercentage,
        packageDays: data.packageDays,
        packageImage: packageColor,
        packageColor: packageBanner,
      });

      setPackages((prev) => [
        ...prev,
        {
          package_id: uuidv4(),
          package_name: data.packageName,
          package_description: data.packageDescription,
          package_percentage: Number(data.packagePercentage),
          package_days: Number(data.packageDays),
          package_is_disabled: false,
          package_color: packageColor ? packageColor : null,
          package_image: packageBanner ? packageBanner : null,
          packages_days: Number(data.packageDays),
        },
      ]);
      closeModal();
      toast({
        title: "Success",
        description: "Files uploaded successfully.",
        variant: "success",
      });
    } catch (error) {
      if (error instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: error.message,
          stackTrace: error.stack,
          stackPath: "components/AdminPackagesPage/CreatePackageModal.tsx",
        });
      }
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const bannerImage = watch("file");
  const packageColor = watch("packageColor");

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}
    >
      <DialogTrigger asChild>
        <Button
          variant="card"
          onClick={() => {
            setOpen(true);
          }}
        >
          Create Package
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Package</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Package Name */}
          <div>
            <Label htmlFor="packageName">Package Name</Label>
            <Controller
              name="packageName"
              control={control}
              render={({ field }) => (
                <Input
                  id="packageName"
                  placeholder="Enter package name"
                  {...field}
                />
              )}
            />
            {errors.packageName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.packageName.message}
              </p>
            )}
          </div>

          {/* Package Description */}
          <div>
            <Label htmlFor="packageDescription">Package Description</Label>
            <Controller
              name="packageDescription"
              control={control}
              render={({ field }) => (
                <Input
                  id="packageDescription"
                  placeholder="Enter package description"
                  {...field}
                />
              )}
            />
            {errors.packageDescription && (
              <p className="text-red-500 text-sm mt-1">
                {errors.packageDescription.message}
              </p>
            )}
          </div>

          {/* Package Percentage */}
          <div>
            <Label htmlFor="packagePercentage">Package Percentage</Label>
            <Controller
              name="packagePercentage"
              control={control}
              render={({ field }) => (
                <Input
                  id="packagePercentage"
                  type="number"
                  placeholder="Enter package percentage"
                  min="1"
                  {...field}
                />
              )}
            />

            {errors.packagePercentage && (
              <p className="text-red-500 text-sm mt-1">
                {errors.packagePercentage.message}
              </p>
            )}
          </div>

          {/* Package Days */}
          <div>
            <Label htmlFor="packageDays">Package Days</Label>
            <Controller
              name="packageDays"
              control={control}
              render={({ field }) => (
                <Input
                  id="packageDays"
                  type="number"
                  placeholder="Enter package days"
                  min="1"
                  {...field}
                />
              )}
            />
            {errors.packageDays && (
              <p className="text-red-500 text-sm mt-1">
                {errors.packageDays.message}
              </p>
            )}
          </div>

          <div>
            <Controller
              name="file"
              control={control}
              render={({ field }) => (
                <FileUpload
                  label="Upload Package Image"
                  onFileChange={(file) => field.onChange(file)}
                />
              )}
            />
            {!errors.file && bannerImage && (
              <p className="text-md font-bold text-green-700">
                {"File Uploaded Successfully"}
              </p>
            )}

            {errors.file && (
              <p className="text-primaryRed text-sm mt-1">
                {errors.file?.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Controller
              name="packageColor"
              control={control}
              render={({ field }) => (
                <FileUpload
                  label="Upload Package Banner"
                  onFileChange={(file) => field.onChange(file)}
                />
              )}
            />
            {!errors.packageColor && packageColor && (
              <p className="text-md font-bold text-green-700">
                {"File Uploaded Successfully"}
              </p>
            )}

            {errors.packageColor && (
              <p className="text-primaryRed text-sm mt-1">
                {errors.packageColor?.message}
              </p>
            )}
          </div>

          <div className="flex justify-center items-center">
            <Button
              type="submit"
              variant="card"
              className="w-full md:w-auto rounded-md"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin mr-2" />} Submit
            </Button>
          </div>
        </form>
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePackageModal;
