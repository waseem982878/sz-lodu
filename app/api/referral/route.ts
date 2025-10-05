import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { createReferral, getReferrer } from "@/services/referral.service";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { referredByCode } = await request.json();

  if (!referredByCode) {
    return new NextResponse(JSON.stringify({ error: "Referral code is required" }), { status: 400 });
  }

  try {
    const referrer = await getReferrer(referredByCode);
    if (!referrer) {
      return new NextResponse(JSON.stringify({ error: "Invalid referral code" }), { status: 404 });
    }

    // Create a referral record
    await createReferral(referrer.id, (session.user as any).id);

    // You might also credit the referrer here or after the new user completes an action

    return new NextResponse(JSON.stringify({ message: "Referral successful!" }), { status: 200 });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to process referral" }), { status: 500 });
  }
}
