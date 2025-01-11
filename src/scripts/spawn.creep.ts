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
import { SpawnQueueManager as SQM }  from "./spawn.queue.handler";

const roleConfigs = {
    miner: { role: "miner", parts: [WORK, WORK, MOVE] },
    hauler: { role: "hauler", parts: [CARRY, MOVE, MOVE] },
    builder: { role: "builder", parts: [WORK, CARRY, MOVE] },
    upgrader: { role: "upgrader", parts: [WORK, CARRY, MOVE] },
    dummy: { role: "dummy", parts: [WORK, CARRY, MOVE] },
};

let spawnCreeps: {
    spawn(spawn: StructureSpawn): void;
    getEnergyCost(bodyParts: BodyPartConstant[]): number;
    CountCreepsByRole(creeps: { [name: string]: Creep }): Record<string, number>;
    enqueueCreep(
        room: Room,
        role: keyof typeof roleConfigs): void;
};

export default spawnCreeps = {
    spawn(spawn: StructureSpawn) {
        const room = spawn.room;
        const creeps = Game.creeps;

        // Calculate total vacancies
        const totalVacancies = Object.values(Memory.rooms[room.name].sources).reduce(
            (sum, source) => sum + (source.vacancies || 0),
            0
        );

        // Count creeps by role
        const roleCounts = this.CountCreepsByRole(creeps);

        const totalCreeps =
            roleCounts.miner + roleCounts.hauler + roleCounts.builder + roleCounts.upgrader + roleCounts.dummy;

        // Enforce maximum queue length
        if (!SQM.isQueueAvailable(room)) {
            console.log(`[SpawnQueue] Queue is full in room ${room.name}.`);
        }

        // High-priority logic for less than 1 miner creep -> create 3 dummies
        if ((roleCounts.miner < 1) && (roleCounts.dummy < 3)) {
            SQM.clearQueue(room);
            this.enqueueCreep(room, "dummy");
        // We have at least 3 dummies working
        } else if (totalCreeps < 7) {
            if ((roleCounts.miner < 1) && SQM.isQueueAvailable(room)) this.enqueueCreep(room, "miner");
            if ((roleCounts.hauler < 1) && SQM.isQueueAvailable(room)) this.enqueueCreep(room, "hauler");
            if ((roleCounts.hauler < roleCounts.miner * 2) && SQM.isQueueAvailable(room)) this.enqueueCreep(room, "hauler");
            if ((roleCounts.miner < totalVacancies - 1) && SQM.isQueueAvailable(room)) this.enqueueCreep(room, "miner");
        } else {
            // NORMAL QUEUE FORMATION
        }

        // Process the spawn queue
        if ((SQM.getQueueLength(room) > 0) && !spawn.spawning) {
            const nextCreep = SQM.peekQueue(room);

            // Check if nextCreep is defined
            if (nextCreep){
                const energyCapacityAvailable = room.energyCapacityAvailable;
                const creepCost = this.getEnergyCost(nextCreep.parts);

            if (energyCapacityAvailable >= creepCost) {
                const newName = `${nextCreep.role}_${Game.time}`;
                const result = spawn.spawnCreep(nextCreep.parts, newName, {
                    memory: {id:newName, role: nextCreep.role, target: undefined, working: false },
                });

                if (result === OK) {
                    console.log(`[Spawn] Spawning new ${nextCreep.role}: ${newName}`);
                    // this.assignCreepTarget(newName, nextCreep.role, room);
                    SQM.removeFirstFromQueue(room); // Remove the creep from the queue
                    } else {
                        console.log(`[Spawn] Failed to spawn ${nextCreep.role}: ${result}`);
                    }
            }
        }
        }
        },

    CountCreepsByRole(creeps: { [name: string]: Creep }): Record<string, number> {
        return {
            miner: _.filter(creeps, creep => creep.memory.role === "miner").length,
            hauler: _.filter(creeps, creep => creep.memory.role === "hauler").length,
            builder: _.filter(creeps, creep => creep.memory.role === "builder").length,
            upgrader: _.filter(creeps, creep => creep.memory.role === "upgrader").length,
            dummy: _.filter(creeps, creep => creep.memory.role === "dummy").length,
        };
    },

    enqueueCreep(room: Room, role: keyof typeof roleConfigs): void {
        const { role: creepRole, parts } = roleConfigs[role];
        SQM.addToQueue(room, creepRole, parts);
        console.log(`[SpawnQueue] Added ${creepRole} to the queue in room ${room.name}`);
    },

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



