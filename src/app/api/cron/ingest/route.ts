// Cron Job Endpoint - Matthew's responsibility (scheduling), Sean's responsibility (job logic)
// See docs/MATTHEW_INFRA.md and docs/SEAN_DATA.md for details

import { runAllJobs } from "@/jobs";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runAllJobs();
    return Response.json({ success: true, message: "Ingestion completed" });
  } catch (error) {
    console.error("Cron job failed:", error);
    return Response.json(
      { success: false, error: "Ingestion failed" },
      { status: 500 }
    );
  }
}
