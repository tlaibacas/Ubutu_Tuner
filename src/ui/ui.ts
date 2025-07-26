import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import boxen from "boxen";
import packageJson from "../../package.json";

const startMessage = [
  chalk.hex("#E95420")("Ubuntu tuner"),
  chalk.hex("#E95420")("Made by " + packageJson.author),
  chalk.hex("#E95420")("Version " + packageJson.version),
].join("\n");

export function displayWelcomeMessage() {
  console.clear();
  console.log(
    chalk.hex("#E95420")(
      figlet.textSync("Ubuntu Tuner", { horizontalLayout: "full" })
    )
  );
  console.log(
    boxen(startMessage, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "white",
    })
  );
  console.log(
    chalk.white(
      "A tool to help you optimize and customize your Ubuntu experience."
    )
  );
}
