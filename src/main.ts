import { ErrorMapper } from "utils/ErrorMapper";

import MemoryRole from "./scripts/memory.creep";

// import roleHarvester from "./behaviour/harvester";
// import roleUpgrader from "./behaviour/upgrader";

import roleMiner from "./behaviour/miner";
import roleHauler from "./behaviour/hauler";

import spawnCreeps from "./scripts/spawn.creep";

import structureTower from "./structures/tower";
import { NONAME } from "dns";
import analyzeRoom from "./scripts/analysis";
import { isEmpty } from "lodash";
import { RoomMemoryManager } from "memory.handler";
// import * as _ from 'lodash';


export function loop() {

    for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];

            // Initialize room memory
            if (!Memory.rooms[roomName].initialized){
                RoomMemoryManager.initializeRoomMemory(room);
            }

            // Analyze room if necessary
            const lastAnalyzed = Memory.rooms[room.name].lastAnalyzed;
            analyzeRoom.analyze(room);


            // Cleanup expired workers from room memory
            RoomMemoryManager.cleanupExpiredCreeps(room);

            // Add new creeps to room memory
            for (const creepName in Game.creeps) {
                const creep = Game.creeps[creepName];
                if (!Memory.rooms[roomName].creeps[creep.name]) {
                    RoomMemoryManager.addCreepToRoom(room, creep);
                }
            }
        }

    const myStructureKeys = Object.keys(Game.structures);
    const myStructures: Structure<StructureConstant>[] = myStructureKeys.map(key => Game.structures[key]);
    const spawns: StructureSpawn[] = [];
    const towers: StructureTower[] = [];

    for (const struct of myStructures) {
        if (struct.structureType === STRUCTURE_SPAWN) {
            spawns.push(struct as StructureSpawn);
        }
        if (struct.structureType === STRUCTURE_TOWER) {
            towers.push(struct as StructureTower);
        }
    }

    spawns.forEach(spawn => {
        spawnCreeps.spawn(spawn);
    });

    structureTower.run(towers);

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role === "miner") {
            roleMiner.run(creep);
        /*if (creep.memory.role === MemoryRole.HARVESTER.valueOf()) {
            roleHarvester.run(creep);
        }
        if (creep.memory.role === MemoryRole.BUILDER.valueOf()) {
            roleBuilder.run(creep);
        }
        if (creep.memory.role === MemoryRole.UPGRADER.valueOf()) {
            roleUpgrader.run(creep);
        }
            */
        }
    }
    }
