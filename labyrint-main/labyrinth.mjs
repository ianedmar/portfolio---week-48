import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import ANSI from "./utils/ANSI.mjs";
import { readMapFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";
import { readRecordFile } from './utils/fileHelpers.mjs';

const startingLevel = CONST.START_LEVEL_ID;
const levels = loadLevelListings();
let levelData = readMapFile(levels[startingLevel]);
let level = levelData;

const pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.RED,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
    "T": ANSI.COLOR.CYAN,  
    "P": ANSI.COLOR.MAGENTA, 
    "D": ANSI.COLOR.WHITE,
    "♨︎": ANSI.COLOR.YELLOW,  
};

let isDirty = true;
let playerPos = { row: null, col: null };
const EMPTY = " ";
const HERO = "H";
const LOOT = "$";
const HEALTH_POTION = "T";  
const POISON = "P";  
const DOOR = "D";  
const TELEPORT = "♨︎";  
let eventText = "";

const playerStats = {
    hp: 8,
    chash: 0
};

const HP_MAX = 10;
const THINGS = [LOOT, EMPTY, HEALTH_POTION, POISON, DOOR, TELEPORT];  

let npcPositions = []; 

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    let data = readRecordFile(source);
    let levels = {};
    for (const item of data) {
        let keyValue = item.split(":");
        if (keyValue.length >= 2) {
            let key = keyValue[0];
            let value = keyValue[1];
            levels[key] = value;
        }
    }
    return levels;
}

class Labyrinth {
    constructor() {
        this.updatePlayerPosition();
        this.updateNpcPositions();
    }

    updatePlayerPosition() {
        if (playerPos.row == null) {
            for (let row = 0; row < level.length; row++) {
                for (let col = 0; col < level[row].length; col++) {
                    if (level[row][col] == HERO) {
                        playerPos.row = row;
                        playerPos.col = col;
                        break;
                    }
                }
                if (playerPos.row != null) break;
            }
        }
    }

    updateNpcPositions() {
        npcPositions = []; 
        for (let row = 0; row < level.length; row++) {
            for (let col = 0; col < level[row].length; col++) {
                if (level[row][col] === "B") {  
                    npcPositions.push({ row, col });
                }
            }
        }
    }

    update() {
        let drow = 0;
        let dcol = 0;

        if (KeyBoardManager.isUpPressed()) drow = -1;
        else if (KeyBoardManager.isDownPressed()) drow = 1;
        if (KeyBoardManager.isLeftPressed()) dcol = -1;
        else if (KeyBoardManager.isRightPressed()) dcol = 1;

        let tRow = playerPos.row + drow;
        let tcol = playerPos.col + dcol;

        if (THINGS.includes(level[tRow][tcol])) {
            let currentItem = level[tRow][tcol];

            if (currentItem == LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.chash += loot;
                eventText = `Player gained ${loot}$`;
            } else if (currentItem == HEALTH_POTION) {
                playerStats.hp += 2;
                if (playerStats.hp > HP_MAX) playerStats.hp = HP_MAX;  
                eventText = `Health Potion collected! Health increased.`;
            } else if (currentItem == POISON) {
                playerStats.hp -= 2;
                if (playerStats.hp < 0) playerStats.hp = 0;  
                eventText = `Poison collected! Health decreased.`;
            } else if (currentItem == DOOR) {
                this.transitionToNewMap("aSharpPlace");
            } else if (currentItem == TELEPORT) {
                this.handleTeleport();
            }

            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tcol] = HERO;

            playerPos.row = tRow;
            playerPos.col = tcol;

            isDirty = true;
        }

        this.moveNpcs(); 
    }

    moveNpcs() {
        for (const npc of npcPositions) {
            const movement = Math.floor(Math.random() * 3) - 1; 
            const randomDirection = Math.floor(Math.random() * 2); 

            let npcRow = npc.row;
            let npcCol = npc.col;

            if (randomDirection === 0) {
                npcRow += movement;
            } else {
                npcCol += movement; 
            }

      
            if (npcRow >= 0 && npcRow < level.length && npcCol >= 0 && npcCol < level[0].length) {
                
                if (level[npcRow][npcCol] !== "█") {
                    level[npc.row][npc.col] = EMPTY;
                    level[npcRow][npcCol] = "B"; 
                    npc.row = npcRow;
                    npc.col = npcCol;
                }
            }
        }
    }

    transitionToNewMap(levelName) {
        const nextLevelFile = levels[levelName];
        if (nextLevelFile) {
            levelData = readMapFile(nextLevelFile);
            level = levelData;
            this.updatePlayerPosition();
            this.updateNpcPositions(); 
            eventText = `Entering new level: ${levelName}...`;
        } else {
            eventText = `No such level: ${levelName}`;
        }
    }

    handleTeleport() {
        const teleportLocations = this.getTeleportLocations();
        if (teleportLocations.length > 1) {
            const currentTeleport = teleportLocations[0];
            const otherTeleport = teleportLocations[1];
            if (playerPos.row === currentTeleport.row && playerPos.col === currentTeleport.col) {
                playerPos.row = otherTeleport.row;
                playerPos.col = otherTeleport.col;
                eventText = `Teleported to another location!`;
            }
        }
    }

    getTeleportLocations() {
        let locations = [];
        for (let row = 0; row < level.length; row++) {
            for (let col = 0; col < level[row].length; col++) {
                if (level[row][col] === TELEPORT) {
                    locations.push({ row, col });
                }
            }
        }
        return locations;
    }

    draw() {
        if (!isDirty) return;
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);
        let rendering = renderHud();

        for (let row = 0; row < level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < level[row].length; col++) {
                let symbol = level[row][col];
                if (pallet[symbol] !== undefined) {
                    rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
                } else {
                    rowRendering += symbol;
                }
            }
            rowRendering += "\n";
            rendering += rowRendering;
        }

        console.log(rendering);
        if (eventText) {
            console.log(eventText);
            eventText = "";
        }
    }
}

function renderHud() {
    let hpBar = `Life:[${ANSI.COLOR.RED + pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`
    let cash = `$:${playerStats.chash}`;
    return `${hpBar} ${cash}\n`;
}

function pad(len, text) {
    let output = "";
    for (let i = 0; i < len; i++) {
        output += text;
    }
    return output;
}

export default Labyrinth;
