/*
  Warnings:

  - You are about to drop the column `itemId` on the `inventoryentry` table. All the data in the column will be lost.
  - You are about to drop the `accountgroup` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[companyId,voucherNo,type]` on the table `Voucher` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemName` to the `InventoryEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Voucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ledgerName` to the `VoucherEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `accountgroup` DROP FOREIGN KEY `AccountGroup_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `accountgroup` DROP FOREIGN KEY `AccountGroup_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryentry` DROP FOREIGN KEY `InventoryEntry_itemId_fkey`;

-- DropForeignKey
ALTER TABLE `ledger` DROP FOREIGN KEY `Ledger_groupId_fkey`;

-- DropForeignKey
ALTER TABLE `voucherentry` DROP FOREIGN KEY `VoucherEntry_ledgerId_fkey`;

-- DropIndex
DROP INDEX `InventoryEntry_itemId_fkey` ON `inventoryentry`;

-- DropIndex
DROP INDEX `Ledger_groupId_fkey` ON `ledger`;

-- DropIndex
DROP INDEX `VoucherEntry_ledgerId_fkey` ON `voucherentry`;

-- AlterTable
ALTER TABLE `inventoryentry` DROP COLUMN `itemId`,
    ADD COLUMN `itemName` VARCHAR(191) NOT NULL,
    ADD COLUMN `stockItemId` INTEGER NULL,
    ADD COLUMN `unit` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ledger` ADD COLUMN `gstin` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    MODIFY `groupId` INTEGER NULL;

-- AlterTable
ALTER TABLE `stockitem` ADD COLUMN `gstRate` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `voucher` ADD COLUMN `partyGstin` VARCHAR(191) NULL,
    ADD COLUMN `partyLedgerId` INTEGER NULL,
    ADD COLUMN `partyName` VARCHAR(191) NULL,
    ADD COLUMN `placeOfSupply` VARCHAR(191) NULL,
    ADD COLUMN `reference` VARCHAR(191) NULL,
    ADD COLUMN `totalAmount` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `voucherentry` ADD COLUMN `ledgerName` VARCHAR(191) NOT NULL,
    MODIFY `ledgerId` INTEGER NULL;

-- DropTable
DROP TABLE `accountgroup`;

-- CreateTable
CREATE TABLE `Group` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `nature` VARCHAR(191) NULL,
    `companyId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,

    UNIQUE INDEX `Group_name_companyId_key`(`name`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Voucher_companyId_voucherNo_type_key` ON `Voucher`(`companyId`, `voucherNo`, `type`);

-- AddForeignKey
ALTER TABLE `Group` ADD CONSTRAINT `Group_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Group` ADD CONSTRAINT `Group_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ledger` ADD CONSTRAINT `Ledger_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Voucher` ADD CONSTRAINT `Voucher_partyLedgerId_fkey` FOREIGN KEY (`partyLedgerId`) REFERENCES `Ledger`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoucherEntry` ADD CONSTRAINT `VoucherEntry_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `Ledger`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryEntry` ADD CONSTRAINT `InventoryEntry_stockItemId_fkey` FOREIGN KEY (`stockItemId`) REFERENCES `StockItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
