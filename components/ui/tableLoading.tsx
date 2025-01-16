import Image from "next/image";

const TableLoading = () => {
  return (
    <div
      className={`fixed flex inset-0 bg-cardColor/70 dark:bg-zinc-800/70 z-50 flex-col items-center justify-center transition-opacity duration-300`}
    >
      <div className="animate-pulse transition-all duration-1000">
        <Image src="/app-logo.png" alt="thunder" width={100} height={100} />
      </div>
    </div>
  );
};

export default TableLoading;
