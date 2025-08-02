import { spawn } from "child_process";

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
