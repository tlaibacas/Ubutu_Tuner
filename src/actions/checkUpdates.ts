import ora from "ora";
import chalk from "chalk";
import { spawn } from "child_process";
import { showMainMenu } from "../menu/showMainmenu";
import { runApp } from "..";

export async function execSudoCommand(
  command: string,
  sudoPassword: string,
  acceptableExitCodes: number[] = [0]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("sudo", ["-S", "sh", "-c", command]);

    let stderr = "";
    let stdout = "";

    child.stdout.on("data", (data) => {
      const output = data.toString();
      stdout += output;
    });

    child.stderr.on("data", (data) => {
      const error = data.toString();
      stderr += error;
    });

    child.on("close", (code) => {
      if (code !== null && acceptableExitCodes.includes(code)) {
        resolve();
      } else {
        reject(
          new Error(`Command failed with code ${code}: ${stderr || stdout}`)
        );
      }
    });

    child.stdin.write(sudoPassword + "\n");
    child.stdin.end();
  });
}

export async function checkUpdates(sudoPassword: string): Promise<void> {
  console.log();

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
    chalk.hex("#E95420")("🔌 Checking for firmware updates...")
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
  const spinner = ora(
    chalk.hex("#E95420")("📦 Updating APT packages...")
  ).start();
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
  const spinner = ora(
    chalk.hex("#E95420")("🔄 Updating Snap packages...")
  ).start();
  try {
    await execSudoCommand("snap refresh", sudoPassword);
    spinner.succeed(chalk.hex("#E95420")("Snaps updated."));
  } catch (err) {
    spinner.fail(chalk.red("Failed to update Snap packages."));
    throw err;
  }
}

async function updateFlatpak(sudoPassword: string): Promise<void> {
  const spinner = ora(
    chalk.hex("#E95420")("📦 Updating Flatpak packages...")
  ).start();
  try {
    await execSudoCommand("flatpak update -y", sudoPassword);
    spinner.succeed(chalk.hex("#E95420")("Flatpaks updated."));
  } catch (err) {
    spinner.fail(chalk.red("Failed to update Flatpak packages."));
    throw err;
  }
}

async function updateKernel(sudoPassword: string): Promise<void> {
  const spinner = ora(
    chalk.hex("#E95420")("🧬 Checking for kernel updates...")
  ).start();
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
    chalk.hex("#E95420")(
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
    chalk.hex("#E95420")("🧹 Cleaning old Snap versions...")
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
  await runApp();
}
