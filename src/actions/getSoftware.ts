import getSoftwareData from "../actions/getSoftware.json";
import ora from "ora";
import chalk from "chalk";
import { spawn, exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

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

export async function installSoftware(sudoPassword: string): Promise<void> {
  const spinner = ora("🚀 Installing software...").start();

  try {
    const aptPackages = getSoftwareData.apt;
    const snapPackages = getSoftwareData.snap;
    const flatpakPackages = getSoftwareData.flatpak;

    for (const pkg of aptPackages) {
      await execSudoCommand(`apt-get install -y ${pkg}`, sudoPassword);
    }

    for (const pkg of snapPackages) {
      await execSudoCommand(`snap install ${pkg}`, sudoPassword);
    }

    for (const pkg of flatpakPackages) {
      await execSudoCommand(`flatpak install -y ${pkg}`, sudoPassword);
    }

    spinner.succeed(chalk.green("Software installed successfully."));
  } catch (error) {
    spinner.fail(chalk.red("Failed to install software."));
    throw error;
  }
}

export async function installNodeWithNVM(): Promise<void> {
  const spinner = ora("🚀 Installing Node.js via NVM...").start();

  try {
    await execAsync(
      `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`
    );
    await execAsync(
      `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm install 22 && corepack enable yarn`
    );
    await execAsync(`yarn set version classic`);
    await execAsync(`yarn global add eslint typescript npm-check-updates serve nodemon ts-node zx
`);
    spinner.succeed(
      chalk.green("Node.js and Yarn installed successfully via NVM.")
    );
  } catch (error) {
    spinner.fail(chalk.red("Failed to install Node.js via NVM."));
    throw error;
  }
}
