import roleDummy from "./behaviour/dummy";
import roleMiner from "./behaviour/miner";
import roleHauler from "./behaviour/hauler";
import roleSlave from "./behaviour/slave";

import { RoomMemoryManager } from "memory.handler";
import config from "./scripts/config"

import spawnCreeps from "./scripts/spawn.creep";
import analyzeRoom from "./scripts/analysis";


import structureTower from "./structures/tower";


export function loop() {

    for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];

            // Initialize room memory
            if (!Memory.rooms[roomName]){
                RoomMemoryManager.initializeRoomMemory(room);
            };

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

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        for (const name in Game.creeps) {
            const creep = Game.creeps[name];
            if (creep.memory.role === config.roles.miner.role) {
                roleMiner.run(creep);
            } else if (creep.memory.role === config.roles.dummy.role) {
                roleDummy.run(creep);
            } else if (creep.memory.role === config.roles.hauler.role) {
                roleHauler.run(creep);
            } else if (creep.memory.role === config.roles.slave.role) {
                roleSlave.run(creep);
            }
        }
}
}
