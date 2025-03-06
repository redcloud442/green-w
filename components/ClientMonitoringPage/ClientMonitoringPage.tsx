import ClientMonitoringSection from "./ClientMonitoringSection";

const ClientMonitoringPage = () => {
  return (
    <div className="container mx-auto pt-10 p-4">
      <div>
        <header className="mb-4">
          <h1 className="Title">Client Monitoring Page</h1>
          <p className="text-gray-600 dark:text-white">
            View client monitoring data for earnings and withdrawals.
          </p>
        </header>

        <section>
          <ClientMonitoringSection />
        </section>
      </div>
    </div>
  );
};

export default ClientMonitoringPage;
