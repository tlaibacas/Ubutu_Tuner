import { exec } from "child_process";
import ora from "ora";
import chalk from "chalk";

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
  const spinner = ora("Applying sysctl recommended settings...").start();

  const sysctlConfig = `
fs.file-max = 100000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_forward = 0
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_rmem = 4096 87380 6291456
net.ipv4.tcp_wmem = 4096 65536 6291456
net.ipv4.tcp_mtu_probing = 1
net.core.somaxconn = 1024
net.core.netdev_max_backlog = 5000
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
kernel.sysrq = 0
kernel.randomize_va_space = 2
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.tcp_timestamps = 1
net.ipv4.tcp_sack = 1
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_no_metrics_save = 1
`;

  try {
    await execConfigCommand(
      `cp /etc/sysctl.conf /etc/sysctl.conf.bak`,
      sudoPassword
    );

    const escapedConfig = sysctlConfig
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    await execConfigCommand(
      `echo -e "${escapedConfig}" > /etc/sysctl.conf`,
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
  const spinner = ora("Enabling UFW firewall...").start();

  try {
    await execConfigCommand(`ufw enable`, sudoPassword);
    spinner.succeed(chalk.hex("#E95420")("UFW enabled."));
  } catch (err) {
    spinner.fail(chalk.red("Failed to enable UFW."));
    throw err;
  }
}

export async function setConfigs(sudoPassword: string) {
  await setSysctlConfigs(sudoPassword);
  await enableUFW(sudoPassword);
  console.log(chalk.green.bold("\n✔️  Recommended settings applied!\n"));
}
