import Labyrinth from "./labyrinth.mjs"; 
import ANSI from "./utils/ANSI.mjs"; 
import SplashScreen from "./splashScreen.mjs";  
import menu from "./menu.mjs"; 

const REFRESH_RATE = 250;

console.log(ANSI.RESET, ANSI.CLEAR_SCREEN, ANSI.HIDE_CURSOR);

let intervalID = null;
let isBlocked = false;
let state = null;

function init() {
   
    const splash = new SplashScreen(() => {
        startGame();  
    });
    splash.start();  
}

function startGame() {
    state = new Labyrinth(); 
    intervalID = setInterval(update, REFRESH_RATE);
}

function update() {
    if (isBlocked) return;
    isBlocked = true;

    state.update();  
    state.draw();    

    isBlocked = false;
}

init();  
