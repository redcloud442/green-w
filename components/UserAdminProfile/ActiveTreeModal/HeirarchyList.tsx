import { cn } from "@/lib/utils";
import { HeirarchyData } from "@/utils/types";
import { ChevronRight, User } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  data: HeirarchyData[];
};

export const HierarchyList = ({ data }: Props) => {
  const router = useRouter();

  const handleUserClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  return (
    <div className="p-4 rounded-lg ">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        User Hierarchy
      </h2>

      <div className="space-y-2">
        {data.map((node, index) => (
          <div
            key={node.alliance_member_id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-md transition-all",
              "hover:bg-gray-100 cursor-pointer",
              index !== 0 && "pl-4 border-l border-gray-300"
            )}
            style={{ marginLeft: index * 16 }} // Dynamic indentation
            onClick={() => handleUserClick(node.user_id)}
          >
            {/* Arrow Icon for hierarchy */}
            {index !== 0 && <ChevronRight className="w-4 h-4 text-gray-500" />}

            {/* User Avatar */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-white">
                <User className="w-4 h-4" />
              </div>

              {/* Username */}
              <span className="text-blue-600 font-medium hover:underline">
                {node.user_username}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
