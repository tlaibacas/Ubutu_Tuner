import { getSudoPassword } from "./actions/sudoPassword";
import { displayWelcomeMessage } from "./ui/ui";
import { showMainMenu } from "./menu/showMainmenu";

(async () => {
  const sudoPassword = await getSudoPassword();

  displayWelcomeMessage();

  await showMainMenu(sudoPassword);
})();
