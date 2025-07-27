import { spawn } from "child_process";
import inquirer from "inquirer";
import dotenv from "dotenv";

dotenv.config();

const envPassword = process.env.PASSWORD;

export async function getSudoPassword(): Promise<string> {
  if (envPassword && envPassword.length > 0) {
    return envPassword;
  }

  const answers = await inquirer.prompt([
    {
      type: "password",
      name: "sudoPassword",
      message: "Please enter your sudo password:",
      mask: "*",
      validate: (input) =>
        input.length > 0 ? true : "Password cannot be empty",
    },
  ]);
  return answers.sudoPassword;
}

export async function execSudoCommand(
  command: string,
  sudoPassword: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("sudo", ["-S", "sh", "-c", command]);

    let stderr = "";

    child.stdin.write(sudoPassword + "\n");
    child.stdin.end();

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}
