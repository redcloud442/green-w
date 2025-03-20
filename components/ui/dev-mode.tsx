const DevMode = () => {
  return (
    <>
      {process.env.NODE_ENV === "development" && (
        <div className="fixed top-10 right-10 z-50 text-white ">
          <div className="block sm:hidden text-3xl">sm</div>
          <div className="hidden sm:block md:hidden text-3xl">md</div>
          <div className="hidden md:block lg:hidden text-3xl">lg</div>
          <div className="hidden lg:block text-3xl">xl</div>
        </div>
      )}
    </>
  );
};

export default DevMode;
