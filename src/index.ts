import { displayWelcomeMessage } from "./ui/ui";
import { showMainMenu } from "./menu/showMainmenu";

(async () => {
  displayWelcomeMessage();
  await showMainMenu();
})();
