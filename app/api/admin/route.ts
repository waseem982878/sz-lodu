import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]"; // Adjust path if needed
import { NextResponse } from "next/server";

// A simple GET handler to demonstrate admin-only access
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // Check if the user is authenticated and has the 'admin' role
  if (!session || session.user?.role !== 'admin') {
    return new NextResponse(
      JSON.stringify({ error: "Forbidden: You do not have access to this resource." }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Admin-only logic goes here.
  // For example, fetching a list of all users, site statistics, etc.

  return new NextResponse(
    JSON.stringify({ message: "Welcome, Admin!", data: { users: 150, pendingKYC: 12 } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// You can add POST, PUT, DELETE handlers for other admin actions.
// For example, an admin might use a POST request to approve a KYC submission.
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // Example: Approve a user's KYC
    const { userId, status } = await request.json();
    
    if (!userId || !['approved', 'rejected'].includes(status)){
        return new NextResponse(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
    }

    try {
        // You would have a service function for this
        // await updateUserKycStatus(userId, status);
        return new NextResponse(JSON.stringify({ message: `User KYC status updated to ${status}` }), { status: 200 });
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: "Failed to update user status" }), { status: 500 });
    }
}
