import { exec } from "child_process";
import { promisify } from "util";
import ora from "ora";
import chalk from "chalk";

const execAsync = promisify(exec);

export async function checkUpdates(): Promise<void> {
  console.log();

  try {
    await updateFirmware();
    await updateApt();
    await updateSnaps();
    await updateFlatpak();
    await updateKernel();
    console.log(chalk.green.bold("\n✔️  System fully updated!\n"));
    await cleanCache();
  } catch (error) {
    console.error(chalk.red("\n❌ Update process failed."));
    console.error(error instanceof Error ? error.message : error);
  }
}

async function updateFirmware(): Promise<void> {
  const spinner = ora("🔌 Checking for firmware updates...").start();
  try {
    await execAsync("sudo fwupdmgr refresh && sudo fwupdmgr update -y");
    spinner.succeed("Firmware updated.");
  } catch (err) {
    spinner.fail("Failed to update firmware.");
    throw err;
  }
}

async function updateApt(): Promise<void> {
  const spinner = ora("📦 Updating APT packages...").start();
  try {
    await execAsync(
      "sudo apt update && sudo apt upgrade -y && sudo apt autoremove -y"
    );
    spinner.succeed("APT packages updated.");
  } catch (err) {
    spinner.fail("Failed to update APT.");
    throw err;
  }
}

async function updateSnaps(): Promise<void> {
  const spinner = ora("🔄 Updating Snap packages...").start();
  try {
    await execAsync("sudo snap refresh");
    spinner.succeed("Snaps updated.");
  } catch (err) {
    spinner.fail("Failed to update Snap packages.");
    throw err;
  }
}

async function updateFlatpak(): Promise<void> {
  const spinner = ora("📦 Updating Flatpak packages...").start();
  try {
    await execAsync("flatpak update -y");
    spinner.succeed("Flatpaks updated.");
  } catch (err) {
    spinner.fail("Failed to update Flatpak packages.");
    throw err;
  }
}

async function updateKernel(): Promise<void> {
  const spinner = ora("🧬 Checking for kernel updates...").start();
  try {
    await execAsync("sudo apt install --install-recommends linux-generic -y");
    spinner.succeed("Kernel checked and updated (if applicable).");
  } catch (err) {
    spinner.fail("Failed to check/update kernel.");
    throw err;
  }
}

async function cleanCache(): Promise<void> {
  const spinner = ora(
    "🧹 Cleaning cache and removing unused files for APT and Flatpak..."
  ).start();
  try {
    await execAsync(
      "sudo apt clean && sudo apt autoremove -y && sudo apt autoclean"
    );
    await execAsync("flatpak uninstall --unused -y");
    spinner.succeed(
      "Cache cleaned and unused files removed for APT and Flatpak."
    );
  } catch (err) {
    spinner.fail("Failed to clean cache for APT and Flatpak.");
    throw err;
  }

  const spinnerSnap = ora("🧹 Cleaning old Snap versions...").start();
  try {
    await execAsync(
      `sudo snap list --all | awk '/disabled/{print $1, $3}' | while read snapname revision; do sudo snap remove "$snapname" --revision="$revision"; done`
    );
    spinnerSnap.succeed("Old Snap versions removed.");
  } catch (err) {
    spinnerSnap.fail("Failed to clean Snap cache.");
    throw err;
  }
}
