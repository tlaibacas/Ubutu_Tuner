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
