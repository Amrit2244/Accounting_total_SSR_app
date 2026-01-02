"use server";

import { exec } from "child_process";
import util from "util";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const execPromise = util.promisify(exec);

export async function downloadBackup() {
  const userName = "Admin User";

  try {
    // Cloud MySQL password
    const { stdout } = await execPromise(
      "/usr/bin/mysqldump -u root -p805728 tally_db"
    );

    await prisma.dataActivityLog.create({
      data: {
        actionType: "BACKUP",
        performedBy: userName,
        status: "SUCCESS",
      },
    });

    return { success: true, data: stdout };
  } catch (error) {
    console.error("Backup Error:", error);
    return { success: false, error: "Backup failed" };
  }
}

export async function restoreDatabase(formData: FormData) {
  const userName = "Admin User";
  const file = formData.get("file") as File;

  if (!file) return { success: false, error: "No file provided" };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to temp folder on Linux Cloud Server
    const tempPath = path.join("/tmp", `restore_${Date.now()}.sql`);
    await fs.writeFile(tempPath, buffer);

    // Import into MySQL
    await execPromise(`mysql -u root -p805728 tally_db < ${tempPath}`);

    // Clean up temp file
    await fs.unlink(tempPath);

    await prisma.dataActivityLog.create({
      data: {
        actionType: "RESTORE",
        performedBy: userName,
        fileName: file.name,
        status: "SUCCESS",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Restore Error:", error);
    return {
      success: false,
      error: "Restore failed. Ensure the file is a valid SQL dump.",
    };
  }
}
