import { exec } from "child_process";
import ora from "ora";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";
import configs from "./configList.json";

export function execConfigCommand(
  command: string,
  sudoPassword: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const sudoCommand = `echo '${sudoPassword}' | sudo -S sh -c "${command.replace(
      /"/g,
      '\\"'
    )}"`;
    exec(sudoCommand, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function setSysctlConfigs(sudoPassword: string) {
  const spinner = ora("🧠 Applying sysctl recommended settings...").start();

  try {
    await execConfigCommand(
      `cp /etc/sysctl.conf /etc/sysctl.conf.bak`,
      sudoPassword
    );
    const sysctlConfig = Object.entries(configs.sysctl.configs)
      .map(([key, value]) => `${key} = ${value}`)
      .join("\n");

    const tempFilePath = path.join(os.tmpdir(), "sysctl.conf");
    fs.writeFileSync(tempFilePath, sysctlConfig.trim());

    await execConfigCommand(
      `cp "${tempFilePath}" /etc/sysctl.conf`,
      sudoPassword
    );
    await execConfigCommand(`sysctl -p`, sudoPassword);

    spinner.succeed(chalk.hex("#E95420")("Sysctl settings applied."));
  } catch (err) {
    spinner.fail(chalk.red("Failed to apply sysctl settings."));
    throw err;
  }
}

async function enableUFW(sudoPassword: string) {
  const spinner = ora("🔐 Configuring UFW and hardening firewall...").start();

  try {
    await execConfigCommand(`ufw --force reset`, sudoPassword);
    await execConfigCommand(`ufw default deny incoming`, sudoPassword);
    await execConfigCommand(`ufw default allow outgoing`, sudoPassword);
    await execConfigCommand(`ufw allow 80/tcp`, sudoPassword);
    await execConfigCommand(`ufw allow 443/tcp`, sudoPassword);
    await execConfigCommand(`ufw limit 22/tcp`, sudoPassword);
    await execConfigCommand(`ufw logging on`, sudoPassword);
    await execConfigCommand(`ufw --force enable`, sudoPassword);

    spinner.succeed(chalk.hex("#E95420")("Firewall endurecido com sucesso."));
  } catch (err) {
    spinner.fail(chalk.red("❌ Falha ao configurar o firewall."));
    throw err;
  }
}

export async function setConfigs(sudoPassword: string) {
  await setSysctlConfigs(sudoPassword);
  await enableUFW(sudoPassword);
  console.log(
    chalk.green.bold("\n✔️  Recommended security settings applied!\n")
  );
}
