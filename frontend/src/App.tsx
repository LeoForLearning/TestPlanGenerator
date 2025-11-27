function App() {

  return (
    <>
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        🚀 Tailwind is Working!
      </h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        You're now running React + TypeScript + Tailwind CSS.
      </p>

      {/* Button */}
      <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition">
        Click Me
      </button>

      {/* Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 w-full max-w-4xl">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className="bg-white shadow-md rounded-xl p-6 flex flex-col gap-2 hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold text-gray-800">
              Card {num}
            </h3>
            <p className="text-gray-500 text-sm">
              This is a simple card to test Tailwind spacing, rounding, and shadow.
            </p>
            <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm mt-2 hover:bg-gray-700 transition">
              Action
            </button>
          </div>
        ))}
      </div>
    </div>
      
    </>
  )
}

export default App
