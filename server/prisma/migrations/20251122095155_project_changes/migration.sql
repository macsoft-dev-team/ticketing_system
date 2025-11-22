/*
  Warnings:

  - You are about to drop the column `orgCode` on the `servicecenter` table. All the data in the column will be lost.
  - The values [SERVICE_CENTER_HEAD,FIELD_ENGINEER] on the enum `User_role` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Organisation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `Organisation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `servicecenter` DROP FOREIGN KEY `ServiceCenter_orgCode_fkey`;

-- DropIndex
DROP INDEX `ServiceCenter_orgCode_fkey` ON `servicecenter`;

-- AlterTable
ALTER TABLE `organisation` ADD COLUMN `phone` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `product` MODIFY `category` ENUM('MCB', 'VFD', 'RMS', 'SPD', 'WIRE', 'CONNECTOR', 'ENCLOSURE_AND_ACCESSORIES') NULL;

-- AlterTable
ALTER TABLE `servicecenter` DROP COLUMN `orgCode`,
    ADD COLUMN `projectCode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `code` VARCHAR(191) NULL,
    ADD COLUMN `projectName` VARCHAR(191) NULL,
    MODIFY `district` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `orgCode` VARCHAR(191) NULL,
    ADD COLUMN `projectCode` VARCHAR(191) NULL,
    MODIFY `role` ENUM('MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'CUSTOMER_SERVICE_HEAD', 'SERVICE_CENTER_TECHNICIAN', 'CUSTOMER_FIELD_ENGINEER') NULL;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `projectCode` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `organisationId` INTEGER NULL,

    UNIQUE INDEX `Project_projectCode_key`(`projectCode`),
    UNIQUE INDEX `Project_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_UserStates` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_UserStates_AB_unique`(`A`, `B`),
    INDEX `_UserStates_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Organisation_phone_key` ON `Organisation`(`phone`);

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_organisationId_fkey` FOREIGN KEY (`organisationId`) REFERENCES `Organisation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceCenter` ADD CONSTRAINT `ServiceCenter_projectCode_fkey` FOREIGN KEY (`projectCode`) REFERENCES `Project`(`projectCode`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_projectCode_fkey` FOREIGN KEY (`projectCode`) REFERENCES `Project`(`projectCode`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_orgCode_fkey` FOREIGN KEY (`orgCode`) REFERENCES `Organisation`(`orgCode`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserStates` ADD CONSTRAINT `_UserStates_A_fkey` FOREIGN KEY (`A`) REFERENCES `State`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserStates` ADD CONSTRAINT `_UserStates_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
