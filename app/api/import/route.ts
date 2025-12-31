import { NextResponse } from "next/server";
import { processTallyXML } from "@/app/actions/upload-tally";
import { getCurrentUserId } from "@/app/actions/tally";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("xmlFile") as File;
    const companyId = formData.get("companyId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file sent" }, { status: 400 });
    }

    const text = await file.text();
    const result = await processTallyXML(text, parseInt(companyId), userId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Server Error: " + error.message },
      { status: 500 }
    );
  }
}
