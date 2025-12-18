"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

/**
 * Server Action to handle file uploads for Voucher Proofs
 * @param file The file object from the FormData
 * @returns The public URL string of the uploaded file or null
 */
export async function uploadFile(file: File): Promise<string | null> {
  // 1. Basic Validation
  if (!file || file.size === 0) return null;

  try {
    // 2. Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Generate a Unique Filename to prevent overwriting
    // Format: timestamp-originalfilename.ext
    const uniqueId = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-0.]/g, "_"); // Remove special characters
    const filename = `${uniqueId}-${cleanFileName}`;

    // 4. Define the Upload Path
    // Using process.cwd() ensures we are in the root of the project
    const uploadDir = join(process.cwd(), "public", "uploads");
    const path = join(uploadDir, filename);

    // 5. Ensure the "uploads" directory exists
    // { recursive: true } prevents errors if the folder already exists
    await mkdir(uploadDir, { recursive: true });

    // 6. Write the file to disk
    await writeFile(path, buffer);

    console.log(`✅ File uploaded successfully: ${filename}`);

    // 7. Return the relative URL string to be saved in the Prisma DB
    return `/uploads/${filename}`;
  } catch (error) {
    console.error("❌ Upload Error:", error);
    return null;
  }
}
