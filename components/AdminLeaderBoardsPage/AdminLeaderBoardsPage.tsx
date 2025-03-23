import AdminLeaderBoardsPage from "./AdminLeaderBoardsTable";

const AdminUserPage = () => {
  return (
    <div className=" md:p-10">
      <div>
        <header className="mb-4">
          <h1 className="Title">Access the Top Users</h1>
          <p className="text-gray-600 dark:text-white">
            View all your user that are currently in the system
          </p>
        </header>

        {/* Table Section */}
        <section className=" rounded-lg  ">
          <AdminLeaderBoardsPage />
        </section>
      </div>
    </div>
  );
};

export default AdminUserPage;
