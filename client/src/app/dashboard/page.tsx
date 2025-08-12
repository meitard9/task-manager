// /app/dashboard/page.tsx
"use client";

import { useAuth } from "../../context/AuthSessionProvider";
import { useUserSession } from "../../hooks/useUserSession";
import LoadingSpinner from "../../components/LoadingSpinner";
//import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, isLoading, error, logout } = useUserSession();
  // const { accessToken } = useAuth();
  // //const router = useRouter();

  // if (isLoading) {
  //   return <LoadingSpinner />;
  // }

  // if (!accessToken) {
  //   // This handles the case where the session provider couldn't get a token.
  //   // The user will be redirected by the provider, but this prevents a quick flash.
  //   // return (
  //   //   <p className="text-center text-red-500 mt-10">Redirecting to login...</p>
  //   // );
  //   return null;
  // }

  return (
    <div className="p-8">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Dashboard
        </h1>
        {user && (
          <div className="space-y-4">
            <p className="text-xl text-gray-700">
              Welcome,{" "}
              <span className="font-semibold text-blue-600">{user.email}</span>!
            </p>
            <p className="text-sm text-gray-500">
              User ID: <span className="font-mono">{user.userId}</span>
            </p>
          </div>
        )}
        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}
        <button
          onClick={logout}
          className="mt-6 w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition duration-200 shadow-md"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
