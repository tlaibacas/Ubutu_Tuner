import getSoftwareData from "../actions/getSoftwareList.json";
import ora from "ora";
import chalk from "chalk";
import { exec } from "child_process";
import util from "util";
import { execSudoCommand } from "../actions/sudoExec";

const execAsync = util.promisify(exec);

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

    spinner.succeed(chalk.hex("#E95420")("Software installed successfully."));
  } catch (error) {
    spinner.fail(chalk.red("Failed to install software."));
    throw error;
  }
}

export async function installNodeWithNVM(sudoPassword: string): Promise<void> {
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
      chalk.hex("#E95420")("Node.js and Yarn installed successfully via NVM.")
    );
  } catch (error) {
    spinner.fail(chalk.red("Failed to install Node.js via NVM."));
    throw error;
  }
}
