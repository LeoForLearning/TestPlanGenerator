import { usePageTitle } from "../hooks/usePageTitle";

const DashboardPage = () => {
  usePageTitle("Dashboard");

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome to TestPlanGenerator 🚀
        </h1>
        <p className="text-gray-500 text-sm">
          Build smarter, AI-powered test plans using existing Jira/Azure tickets & uploaded cases.
        </p>
      </div>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Connected Tool", value: "Azure DevOps" },
          { label: "Stored Documents", value: "46 Files" },
          { label: "Last Sync", value: "2h ago" },
          { label: "Generated Test Cases", value: "182" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white/70 backdrop-blur-lg border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
          >
            <p className="text-gray-500 text-sm">{card.label}</p>
            <p className="text-lg font-semibold text-gray-900">{card.value}</p>
          </div>
        ))}
      </section>

      {/* Quick Actions */}
      <section className="bg-white/70 backdrop-blur-lg border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>

        <div className="flex gap-4 flex-wrap">
          <button className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
            Connect to Jira / Azure
          </button>

          <button className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-black transition">
            Upload Test Case File
          </button>

          <button className="px-5 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-200 transition">
            Generate Test Cases
          </button>
        </div>
      </section>

      {/* Two-Column Panels */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Tickets */}
        <div className="bg-white/70 backdrop-blur-lg border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Recent Tickets</h3>
          <ul className="space-y-2 text-sm">
            <li className="border-b py-2">🔹 JIRA-231: Login failing on OTP</li>
            <li className="border-b py-2">🔹 JIRA-228: API timeout issue</li>
            <li className="border-b py-2">🔹 ADO-110: Incorrect table rendering</li>
            <li>🔹 ADO-108: Rate limiter not resetting</li>
          </ul>
        </div>

        {/* Uploaded Files */}
        <div className="bg-white/70 backdrop-blur-lg border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Stored Test Case Files</h3>
          <ul className="space-y-2 text-sm">
            <li className="border-b py-2">📄 TestSuite_v1.xlsx — Embedded ✔</li>
            <li className="border-b py-2">📄 RegressionCases.xlsx — Embedded ✔</li>
            <li>📄 MobileTests.xlsx — Pending embedding…</li>
          </ul>
        </div>
      </section>

      {/* Logs */}
      <section className="bg-white/70 backdrop-blur-lg border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Recent Activity</h3>
        
        <ul className="text-sm space-y-2 text-gray-600">
          <li>📝 Test cases generated for ticket JIRA-231 (5 mins ago)</li>
          <li>📁 Uploaded RegressionCases.xlsx to ChromaDB (1 hr ago)</li>
          <li>🔗 Connected to Azure DevOps instance (Today 09:15 AM)</li>
        </ul>
      </section>
    </div>
  );
};

export default DashboardPage;
