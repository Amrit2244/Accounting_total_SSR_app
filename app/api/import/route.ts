import { NextResponse } from "next/server";
// ✅ IMPORT from the updated file above
import { processTallyXML, getCurrentUserId } from "@/app/actions/tally";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("xmlFile") as File;
    const companyId = formData.get("companyId") as string;

    if (!file)
      return NextResponse.json({ error: "No file sent" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const buf = Buffer.from(buffer);
    let text = buf.toString("utf-8");
    if (text.includes("\u0000")) text = buf.toString("utf16le");

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
