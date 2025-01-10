import { ErrorMapper } from "utils/ErrorMapper";

import MemoryRole from "./scripts/memory.creep";
// import roleBuilder from "./behaviour/builder";
// import roleHarvester from "./behaviour/harvester";
// import roleUpgrader from "./behaviour/upgrader";
import spawnCreeps from "./scripts/spawn.creep";
import roleMiner from "./behaviour/miner";
import structureTower from "./structures/tower";
import { NONAME } from "dns";
import analyzeRoom from "./scripts/analysis";
import { isEmpty } from "lodash";
import { RoomMemoryManager } from "memory.handler";
// import * as _ from 'lodash';


export function loop() {

    for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];

            console.log(`Processing room: ${roomName}`);

            // Initialize room memory
            RoomMemoryManager.initializeRoomMemory(room);

            console.log("Memory after initialization:", JSON.stringify(Memory.rooms[roomName]));

            // Analyze room if necessary
            const lastAnalyzed = Memory.rooms[room.name]?.lastAnalyzed || 0;
            if (Game.time - lastAnalyzed > 60) {
                analyzeRoom.analyze(room);
            }

            // Cleanup expired workers
            RoomMemoryManager.cleanupExpiredCreeps(room);

            // Add new creeps to room memory
            for (const creepName in Game.creeps) {
                const creep = Game.creeps[creepName];
                if (!Memory.rooms[roomName].creeps[creep.name]) {
                    RoomMemoryManager.addCreepToRoom(room, creep);
                }
            }
        }

//   console.log("1");
//   for (const roomName in Game.rooms) {
//     const room = Game.rooms[roomName];

//     // Initialize room memory
//     RoomMemoryManager.initializeRoomMemory(room);
//     console.log("2");

//     // Analyze room if necessary
//     if(Game.time - Memory.rooms[room.name].lastAnalyzed! || 0 < 1000){
//       analyzeRoom.analyze(room);
//     }
//     console.log("3");
//     // Cleanup expired workers
//     RoomMemoryManager.cleanupExpiredCreeps(room);

//     // Add new creeps to room memory
//     for (const creepName in Game.creeps) {
//         const creep = Game.creeps[creepName];
//         if (!Memory.rooms[roomName].creeps[creep.name]) {
//             RoomMemoryManager.addCreepToRoom(room, creep);
//         }
//     }
// }
// console.log("4");

  //   if (!Memory.rooms) {
  //     Memory.rooms = {};
  // }
      if (Object.keys(Memory.rooms).length === 0) {
      // Memory.rooms is empty; execute code once here
      console.log("No rooms in Memory.rooms, executing analysis code...");
      for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
      analyzeRoom.analyze(room);
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
        for (const name in Game.creeps) {
          const creep = Game.creeps[name];
          if (creep.memory.role === "miner") {
              roleMiner.run(creep);
          }
      }
    }
  }
