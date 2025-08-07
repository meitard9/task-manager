// /components/LoadingSpinner.tsx
import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-gray-700 text-lg font-medium">Loading session...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
