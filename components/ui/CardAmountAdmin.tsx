import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  title: string;
  value: React.ReactNode;
  description?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
};

const CardAmountAdmin = ({
  title,
  value,
  description,
  descriptionClassName = "text-sm text-gray-500",
  children,
}: Props) => {
  return (
    <Card className="w-full md:min-w-md border-cyan-700">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="flex gap-x-2 text-xl font-bold">
          {value}
        </CardDescription>
        {description && (
          <CardDescription className={descriptionClassName}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default CardAmountAdmin;
