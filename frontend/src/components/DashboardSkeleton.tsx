export default function DashboardSkeleton({ darkMode = false }: { darkMode?: boolean }) {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className={`h-8 w-64 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
        <div className={`h-10 w-32 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`rounded-xl p-6 border-2 ${
              darkMode ? 'bg-dark-400/50 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            <div className={`h-4 w-24 rounded mb-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            <div className={`h-8 w-16 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-xl p-6 border-2 ${
              darkMode ? 'bg-dark-400/50 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            <div className={`h-6 w-48 rounded mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className={`h-16 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div
        className={`rounded-xl border-2 overflow-hidden ${
          darkMode ? 'bg-dark-400/50 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`h-6 w-40 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-3/4 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                <div className={`h-3 w-1/2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
              </div>
              <div className={`h-8 w-20 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
