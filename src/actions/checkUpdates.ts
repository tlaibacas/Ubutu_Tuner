import ora from "ora";
import chalk from "chalk";
import { execSudoCommand } from "../actions/sudoExec";

export async function checkUpdates(sudoPassword: string): Promise<void> {
  try {
    await updateFirmware(sudoPassword);

    await updateApt(sudoPassword);

    await updateSnaps(sudoPassword);

    await updateFlatpak(sudoPassword);

    await updateKernel(sudoPassword);

    console.log(chalk.green.bold("\n✔️  System fully updated!\n"));

    await cleanCache(sudoPassword);
  } catch (error) {
    console.error(chalk.red("\n❌ Update process failed."));
    console.error(
      error instanceof Error
        ? chalk.red(error.message)
        : chalk.red(String(error))
    );
  }
}

async function updateFirmware(sudoPassword: string): Promise<void> {
  const spinner = ora(
    chalk.white("🔌 Checking for firmware updates...")
  ).start();
  try {
    await execSudoCommand(
      "fwupdmgr refresh --force && fwupdmgr update -y --force",
      sudoPassword,
      [0, 2]
    );
    spinner.succeed(chalk.hex("#E95420")("Firmware updated."));
  } catch (err) {
    spinner.fail(chalk.red("Failed to update firmware."));
    throw err;
  }
}

async function updateApt(sudoPassword: string): Promise<void> {
  const spinner = ora(chalk.white("📦 Updating APT packages...")).start();
  try {
    await execSudoCommand(
      "apt update && apt upgrade -y && apt autoremove -y",
      sudoPassword
    );
    spinner.succeed(chalk.hex("#E95420")("APT packages updated."));
  } catch (err) {
    spinner.fail(chalk.red("Failed to update APT."));
    throw err;
  }
}

async function updateSnaps(sudoPassword: string): Promise<void> {
  const spinner = ora(chalk.white("🔄 Updating Snap packages...")).start();
  try {
    await execSudoCommand("snap refresh", sudoPassword);
    spinner.succeed(chalk.hex("#E95420")("Snaps updated."));
  } catch (err) {
    spinner.fail(chalk.red("Failed to update Snap packages."));
    throw err;
  }
}

async function updateFlatpak(sudoPassword: string): Promise<void> {
  const spinner = ora(chalk.white("📦 Updating Flatpak packages...")).start();
  try {
    await execSudoCommand("flatpak update -y", sudoPassword);
    spinner.succeed(chalk.hex("#E95420")("Flatpaks updated."));
  } catch (err) {
    spinner.fail(chalk.red("Failed to update Flatpak packages."));
    throw err;
  }
}

async function updateKernel(sudoPassword: string): Promise<void> {
  const spinner = ora(chalk.white("🧬 Checking for kernel updates...")).start();
  try {
    await execSudoCommand(
      "apt install --install-recommends linux-generic -y",
      sudoPassword
    );
    spinner.succeed(
      chalk.hex("#E95420")("Kernel checked and updated (if applicable).")
    );
  } catch (err) {
    spinner.fail(chalk.red("Failed to check/update kernel."));
    throw err;
  }
}

async function cleanCache(sudoPassword: string): Promise<void> {
  const spinner = ora(
    chalk.white(
      "🧹 Cleaning cache and removing unused files for APT and Flatpak..."
    )
  ).start();
  try {
    await execSudoCommand(
      "apt clean && apt autoremove -y && apt autoclean",
      sudoPassword
    );
    await execSudoCommand("flatpak uninstall --unused -y", sudoPassword);
    spinner.succeed(
      chalk.hex("#E95420")(
        "Cache cleaned and unused files removed for APT and Flatpak."
      )
    );
  } catch (err) {
    spinner.fail(chalk.red("Failed to clean cache for APT and Flatpak."));
    throw err;
  }

  const spinnerSnap = ora(
    chalk.white("🧹 Cleaning old Snap versions...")
  ).start();
  try {
    await execSudoCommand(
      `snap list --all | awk '/disabled/{print $1, $3}' | while read snapname revision; do snap remove "$snapname" --revision="$revision"; done`,
      sudoPassword
    );
    spinnerSnap.succeed(chalk.hex("#E95420")("Old Snap versions removed."));
  } catch (err) {
    spinnerSnap.fail(chalk.red("Failed to clean Snap cache."));
    throw err;
  }

  const spinnerJournal = ora(
    chalk.white("🧹 Cleaning systemd journal logs older than 100MB...")
  ).start();
  try {
    await execSudoCommand("journalctl --vacuum-size=100M", sudoPassword);
    spinnerJournal.succeed(
      chalk.hex("#E95420")("Systemd journal logs cleaned.")
    );
  } catch (err) {
    spinnerJournal.fail(chalk.red("Failed to clean systemd journal logs."));
    throw err;
  }

  const spinnerKernels = ora(
    chalk.white("🧹 Removing old kernels and unused packages...")
  ).start();
  try {
    await execSudoCommand("apt-get autoremove --purge -y", sudoPassword);
    spinnerKernels.succeed(chalk.hex("#E95420")("Old kernels removed."));
  } catch (err) {
    spinnerKernels.fail(chalk.red("Failed to remove old kernels."));
    throw err;
  }

  const spinnerThumbnails = ora(
    chalk.white("🧹 Cleaning cached thumbnails...")
  ).start();
  try {
    await execSudoCommand("rm -rf ~/.cache/thumbnails/*", sudoPassword);
    spinnerThumbnails.succeed(
      chalk.hex("#E95420")("Cached thumbnails cleaned.")
    );
  } catch (err) {
    spinnerThumbnails.fail(chalk.red("Failed to clean cached thumbnails."));
  }

  const spinnerLogs = ora(
    chalk.white("🧹 Removing system logs older than 30 days...")
  ).start();
  try {
    await execSudoCommand(
      `find /var/log -type f -mtime +30 -exec rm -f {} +`,
      sudoPassword
    );
    spinnerLogs.succeed(chalk.hex("#E95420")("Old system logs removed."));
  } catch (err) {
    spinnerLogs.fail(chalk.red("Failed to remove old system logs."));
  }
  const spinnerDeborphan = ora(
    chalk.white("🧹 Removing orphaned packages with deborphan...")
  ).start();

  try {
    await execSudoCommand(
      `deborphan | xargs -r sudo apt-get -y remove --purge`,
      sudoPassword
    );
    spinnerDeborphan.succeed(
      chalk.hex("#E95420")("Orphaned packages removed.")
    );
  } catch (err) {
    spinnerDeborphan.fail(chalk.red("Failed to remove orphaned packages."));
    throw err;
  }
}
