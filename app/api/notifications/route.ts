import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]"; // Adjust path if needed
import { NextResponse } from "next/server";
import { getUserNotifications } from "@/services/notification.service"; // You'll create this

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const notifications = await getUserNotifications(session.user.id);
    return new NextResponse(JSON.stringify(notifications), { status: 200 });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch notifications" }), { status: 500 });
  }
}
