import readline from "readline";
import ANSI from "./utils/ANSI.mjs";

export default function menu(onSelection) {
    console.clear();
    console.log(ANSI.CLEAR_SCREEN + ANSI.RESET);
    console.log(ANSI.BOLD + "Welcome to the Labyrinth Game!" + ANSI.RESET);
    console.log("1. Play");
    console.log("2. Exit");
    console.log("Choose an option: ");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question("", (input) => {
        rl.close();
        if (input.trim() === "1") {
            onSelection("Play");
        } else if (input.trim() === "2") {
            onSelection("Exit");
        } else {
            console.log("Invalid option. Please restart the game.");
            process.exit();
        }
    });
}
