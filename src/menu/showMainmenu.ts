import inquirer from "inquirer";
import chalk from "chalk";
import { checkUpdates } from "../actions/checkUpdates";

export async function showMainMenu(sudoPassword: string): Promise<void> {
  console.log();

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: chalk.hex("#E95420")("What would you like to do?"),
      choices: [
        { name: "🔄  Check for system updates", value: "update" },
        { name: "⚙️  Apply recommended settings", value: "config" },
        { name: "📦  Run everything (update + config)", value: "all" },
        { name: "🚪  Exit", value: "exit" },
      ],
    },
  ]);

  await handleAction(answers.action, sudoPassword);
}

async function handleAction(
  action: string,
  sudoPassword: string
): Promise<void> {
  switch (action) {
    case "update":
      await checkUpdates(sudoPassword);
      break;
    case "config":
      console.log(chalk.hex("#E95420")("→ Applying configuration tweaks..."));
      break;
    case "all":
      console.log(chalk.hex("#E95420")("→ Running full system tune..."));
      break;
    case "exit":
      console.log(chalk.gray("Exiting Ubuntu Tuner... 👋"));
      process.exit(0);
  }
}
