// import * as _ from "lodash";
// import memoryCreep from "./memory.creep";
// import roleMiner from "../behaviour/miner";

// let spawnCreeps: {
//     spawn(spawn: StructureSpawn): void;
// };

// export default spawnCreeps = {
//     spawn(spawn) {
//         /**
//          * Add a creep to a source in memory.
//          * @param {Creep} creep - The creep to assign.
//          * @param {Source} source - The source to assign the creep to.
//          */
//         function addCreepToSource(creep: Creep, source: Source): void {

//             const roomMemory = Memory.rooms[creep.room.name];
//             if (!roomMemory) {
//                 console.log(`[${creep.name}] Room memory is not initialized.`);
//                 return;
//             }

//             const sourceMemory = roomMemory.sources[source.id];
//             if (!sourceMemory) {
//                 console.log(`[${creep.name}] Source ${source.id} is not in room memory.`);
//                 return;
//             }

//             // Assign creep to the source
//             sourceMemory.creeps.push(creep.name);
//             creep.memory.target = source.id;
//             console.log(`[${creep.name}] Assigned to source: ${source.id}`);
//         }

//         // Find all miners in the room
//         const miners = _.filter(Game.creeps, creep => creep.memory.role === memoryCreep.MINER);

//         // Determine the required number of miners
//         const requiredMiners = roleMiner.numMiners(spawn.room);

//         // Spawn miners if needed
//         if (miners.length < requiredMiners) {
//             const newName = "Miner" + Game.time;
//             console.log(`Spawning new miner: ${newName}`);

//             // Find a source with vacancies
//             const roomMemory = Memory.rooms[spawn.room.name];
//             const availableSource = Object.values(roomMemory.sources)
//                 .find(source => source.vacancies > source.creeps.length);

//             if (availableSource) {
//                 const spawnResult = spawn.spawnCreep([WORK, WORK, MOVE], newName, {
//                     memory: {
//                         id: newName,
//                         role: memoryCreep.MINER },
//                 });

//                 if (spawnResult === OK) {
//                     console.log(`[${newName}] Successfully spawned.`);
//                     const newCreep = Game.creeps[newName];
//                     if (newCreep) {
//                         addCreepToSource(newCreep, Game.getObjectById(availableSource.id)!);
//                     }
//                 } else {
//                     console.log(`[${newName}] Spawn failed with error: ${spawnResult}`);
//                 }
//             } else {
//                 console.log("No available sources with vacancies for new miners.");
//             }
//         }

//         // Display spawning progress visually
//         if (spawn.spawning) {
//             const spawningCreep = Game.creeps[spawn.spawning.name];
//             spawn.room.visual.text(
//                 `🛠️ ${spawningCreep.memory.role}`,
//                 spawn.pos.x + 1,
//                 spawn.pos.y,
//                 { align: "left", opacity: 0.8 }
//             );
//         }
//     }
// };


import _ from "lodash";
import { SpawnQueueManager } from "./spawn.queue.handler";

let spawnCreeps: {
    spawn(spawn: StructureSpawn): void;
    getEnergyCost(bodyParts: BodyPartConstant[]): number;
};

export default spawnCreeps = {
    spawn(spawn: StructureSpawn) {
        const room = spawn.room;
        const creeps = Game.creeps;

        // Count creeps by role
        const miners = _.filter(creeps, creep => creep.memory.role === "miner").length;
        const haulers = _.filter(creeps, creep => creep.memory.role === "hauler").length;
        const builders = _.filter(creeps, creep => creep.memory.role === "builder").length;
        const upgraders = _.filter(creeps, creep => creep.memory.role === "upgrader").length;

        const totalCreeps = miners + haulers + builders + upgraders;

        // Define role configurations
        const minerEntity = { role: "miner", parts: [WORK, WORK, MOVE] };
        const haulerEntity = { role: "hauler", parts: [CARRY, MOVE, MOVE] };
        const builderEntity = { role: "builder", parts: [WORK, CARRY, MOVE] };
        const upgraderEntity = { role: "upgrader", parts: [WORK, CARRY, MOVE] };

        // Enforce maximum queue length of 4
        if (SpawnQueueManager.getQueueLength(room) >= 4) {
            console.log(`[SpawnQueue] Queue is full in room ${room.name}.`);
            return;
        }

        if (totalCreeps < 6) {
            // Border case: High-priority logic when fewer than 6 creeps
            if (miners < 1) {
                SpawnQueueManager.addToQueue(room, minerEntity.role, minerEntity.parts);
            }
            if (haulers < 1) {
                SpawnQueueManager.addToQueue(room, haulerEntity.role, haulerEntity.parts);
            }
            if (haulers < miners * 2) {
                SpawnQueueManager.addToQueue(room, haulerEntity.role, haulerEntity.parts);
            }
            if (miners < Math.floor(haulers / 2)) {
                SpawnQueueManager.addToQueue(room, minerEntity.role, minerEntity.parts);
            }
        } else {
            // Smooth operation logic when there are at least 6 creeps
            if (builders < 2) {
                SpawnQueueManager.addToQueue(room, builderEntity.role, builderEntity.parts);
            }
            if (upgraders < 2) {
                SpawnQueueManager.addToQueue(room, upgraderEntity.role, upgraderEntity.parts);
            }

            // Dynamic spawn for higher-level logic
            if (haulers < miners * 2) {
                SpawnQueueManager.addToQueue(room, haulerEntity.role, haulerEntity.parts);
            }
            if (miners < Math.floor(haulers / 2)) {
                SpawnQueueManager.addToQueue(room, minerEntity.role, minerEntity.parts);
            }
        }
    },
    // Process the spawn queue
    //     if (spawnQueue.length > 0 && !spawn.spawning) {
    //         const nextCreep = spawnQueue[0];
    //         const energyAvailable = room.energyAvailable;
    //         const creepCost = this.getEnergyCost(nextCreep.parts);

    //         if (energyAvailable >= creepCost) {
    //             const newName = `${nextCreep.role}_${Game.time}`;
    //             const result = spawn.spawnCreep(nextCreep.parts, newName, {
    //                 memory: { role: nextCreep.role, target: null, working: false },
    //             });

    //             if (result === OK) {
    //                 console.log(`[Spawn] Spawning new ${nextCreep.role}: ${newName}`);
    //                 this.assignCreepTarget(newName, nextCreep.role, room);
    //                 spawnQueue.shift(); // Remove the creep from the queue
    //             } else {
    //                 console.log(`[Spawn] Failed to spawn ${nextCreep.role}: ${result}`);
    //             }
    //         }
    //     }
    // },

    // /**
    //  * Assign a target to a newly spawned creep based on its role.
    //  * @param {string} creepName - The name of the creep.
    //  * @param {string} role - The role of the creep.
    //  * @param {Room} room - The room the creep belongs to.
    //  */
    // assignCreepTarget(creepName: string, role: string, room: Room): void {
    //     const creep = Game.creeps[creepName];
    //     if (!creep) {
    //         console.log(`[Assign] Creep ${creepName} does not exist.`);
    //         return;
    //     }

    //     if (role === "miner") {
    //         // Assign the miner to a source with vacancies
    //         const sources = room.find(FIND_SOURCES);
    //         const source = sources.find(src => {
    //             const sourceMemory = Memory.rooms[room.name].sources[src.id];
    //             return sourceMemory?.creeps.length < sourceMemory?.vacancies;
    //         });

    //         if (source) {
    //             creep.memory.target = source.id;
    //             Memory.rooms[room.name].sources[source.id].creeps.push(creepName);
    //             console.log(`[Assign] Miner ${creepName} assigned to source: ${source.id}`);
    //         }
    //     } else if (role === "hauler") {
    //         // Haulers get energy drops or containers as targets
    //         const droppedResources = room.find(FIND_DROPPED_RESOURCES, {
    //             filter: res => res.resourceType === RESOURCE_ENERGY,
    //         });

    //         if (droppedResources.length > 0) {
    //             creep.memory.target = droppedResources[0].id;
    //             console.log(`[Assign] Hauler ${creepName} assigned to dropped energy: ${droppedResources[0].id}`);
    //         }
    //     } else if (role === "builder" || role === "upgrader") {
    //         // Builders and upgraders focus on the controller or construction sites
    //         if (role === "builder") {
    //             const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
    //             if (constructionSites.length > 0) {
    //                 creep.memory.target = constructionSites[0].id;
    //                 console.log(`[Assign] Builder ${creepName} assigned to site: ${constructionSites[0].id}`);
    //             }
    //         } else if (role === "upgrader") {
    //             creep.memory.target = room.controller?.id || null;
    //             console.log(`[Assign] Upgrader ${creepName} assigned to controller.`);
    //         }
    //     }
    // },

    /**
     * Calculate the total energy cost of a body part array.
     * @param {BodyPartConstant[]} bodyParts
     * @returns {number} The total energy cost.
     */
    getEnergyCost(bodyParts: BodyPartConstant[]): number {
        const bodyPartCosts: { [part in BodyPartConstant]: number } = {
            move: 50,
            work: 100,
            carry: 50,
            attack: 80,
            ranged_attack: 150,
            heal: 250,
            claim: 600,
            tough: 10,
        };
        return bodyParts.reduce((cost, part) => cost + bodyPartCosts[part], 0);
    },
};

