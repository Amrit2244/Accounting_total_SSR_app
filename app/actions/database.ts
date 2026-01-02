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
    // 1. /usr/bin/mysqldump ensures the OS finds the command
    // 2. --column-statistics=0 is REQUIRED for MySQL 8+ to avoid permission errors
    // 3. --no-tablespaces prevents 'Access Denied' for the process user
    const command =
      "/usr/bin/mysqldump --column-statistics=0 --no-tablespaces -u root -p805728 tally_db";

    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 1024 * 1024 * 50, // Allows backups up to 50MB
    });

    if (stderr && !stdout) {
      console.error("mysqldump stderr:", stderr);
      throw new Error(stderr);
    }

    await prisma.dataActivityLog.create({
      data: {
        actionType: "BACKUP",
        performedBy: userName,
        status: "SUCCESS",
      },
    });

    return { success: true, data: stdout };
  } catch (error: any) {
    console.error("FULL BACKUP ERROR:", error);
    return { success: false, error: error.message || "Backup failed" };
  }
}

export async function restoreDatabase(formData: FormData) {
  const userName = "Admin User";
  const file = formData.get("file") as File;

  if (!file) return { success: false, error: "No file provided" };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Using /tmp is standard for Linux cloud servers
    const tempPath = path.join("/tmp", `restore_${Date.now()}.sql`);
    await fs.writeFile(tempPath, buffer);

    // Import command using absolute path for mysql
    const command = `/usr/bin/mysql -u root -p805728 tally_db < ${tempPath}`;
    await execPromise(command);

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
  } catch (error: any) {
    console.error("FULL RESTORE ERROR:", error);
    return { success: false, error: error.message || "Restore failed" };
  }
}
