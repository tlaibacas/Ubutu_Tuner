import { getSudoPassword } from "./actions/sudoPassword";
import { displayWelcomeMessage } from "./ui/ui";
import { showMainMenu } from "./menu/showMainmenu";

export async function runApp() {
  const sudoPassword = await getSudoPassword();

  displayWelcomeMessage();

  await showMainMenu(sudoPassword);
}

runApp();
