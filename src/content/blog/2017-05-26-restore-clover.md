---
title: 'Restore Clover Using Windows'
description: 'Learn how to restore the Clover bootloader using Windows. A guide for Hackintosh users.'
pubDate: 'May 26 2017'
heroImage: '../../assets/images/restore-clover.jpg'
category: 'Misc'
tags: ['hackintosh', 'clover', 'windows']
---

# Restore Your \`config.plist\`

Clover is a boot manager that allows you to select which operating system (OS) to boot. It is widely used by Hackintosh enthusiasts—people who install macOS (alongside other OSs like Linux and Windows) on non-Apple hardware.

Configuring Clover can be tricky, and a small mistake can easily render your macOS unbootable. For this reason, it’s highly recommended to keep a backup of the `/EFI/CLOVER/config.plist` configuration file.

If your macOS boot becomes unusable but you still have a working Windows installation on the same machine, follow these steps to restore a backup of your `config.plist`:

## Steps to Restore \`config.plist\`

1. Open a command prompt with administrator privileges (`cmd.exe` as Administrator) and enter the following commands:

   - `diskpart` – Open the disk partitioning tool.
   - `list disk` – List all available hard drives.
   - `select disk 1` – Select the disk containing your Clover EFI boot (replace `1` with the correct disk number for your setup).
   - `list partition` – Display the partitions on the selected disk.
   - `select partition 1` – Choose the EFI boot partition (replace `1` with the correct partition number).
   - `assign letter=s` – Assign a drive letter to the partition (`S` is used as an example here).
   - `exit` – Exit the disk partitioning tool.
   - `s:` – Navigate to the assigned boot partition.
   - `cd EFI\CLOVER\` – Navigate to the Clover folder.
   - `copy c:\backups\config.plist .` – Copy your backup `config.plist` file into the folder (replace `c:\backups` with the actual path to your backup file).

2. If everything worked correctly, restart your computer, and you should be able to boot macOS again.

## Troubleshooting with Clover Prefixes

If issues persist, the following Clover boot flags can help identify and resolve problems:

- `-x` – Boot in safe mode.
- `-v` – Enable verbose mode for detailed logs during boot.

## Additional Resources

For more information about Hackintosh setups and Clover, visit [tonymacx86](https://www.tonymacx86.com/).
