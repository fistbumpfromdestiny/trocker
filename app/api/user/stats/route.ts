import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/db";

// GET - Get user statistics
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: '__Secure-authjs.session-token',
    });

    console.log('[STATS DEBUG] Token:', JSON.stringify(token, null, 2));

    if (!token || !token.id) {
      console.log('[STATS DEBUG] No token or token.id');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get total location reports
    const totalReports = await prisma.locationReport.count({
      where: { userId: token.id },
    });

    const totalReportsV2 = await prisma.locationReportV2.count({
      where: { userId: token.id },
    });

    // Get recent reports
    const recentReports = await prisma.locationReportV2.findMany({
      where: { userId: token.id },
      include: {
        location: true,
        apartment: true,
        cat: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get most reported locations
    const locationCounts = await prisma.locationReportV2.groupBy({
      by: ["locationId"],
      where: { userId: token.id },
      _count: {
        locationId: true,
      },
      orderBy: {
        _count: {
          locationId: "desc",
        },
      },
      take: 5,
    });

    // Get location details for top locations
    const topLocationIds = locationCounts.map((lc) => lc.locationId);
    const locations = await prisma.location.findMany({
      where: { id: { in: topLocationIds } },
    });

    const topLocations = locationCounts.map((lc) => {
      const location = locations.find((l) => l.id === lc.locationId);
      return {
        location: location?.name || "Unknown",
        count: lc._count.locationId,
      };
    });

    // Get total messages sent
    const totalMessages = await prisma.message.count({
      where: {
        userId: token.id,
        deletedAt: null,
      },
    });

    // Get account info
    const user = await prisma.user.findUnique({
      where: { id: token.id },
      include: {
        accounts: true,
      },
    });

    const isOAuthUser = user?.accounts && user.accounts.length > 0;
    const oAuthProvider = isOAuthUser ? user.accounts[0].provider : null;

    return NextResponse.json({
      totalReports: totalReports + totalReportsV2,
      recentReports,
      topLocations,
      totalMessages,
      isOAuthUser,
      oAuthProvider,
      memberSince: user?.createdAt,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
