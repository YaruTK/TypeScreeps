// let roleUpgrader: {
//     /** @param {Creep} creep **/
//     run(creep: Creep): void;
//     numUpgraders(room: Room, numHarvesters: number): number;
// };

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// export default roleUpgrader = {
//     run(creep) {
//         if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
//             creep.memory.upgrading = false;
//             creep.say("🔄 harvest");
//         }
//         if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
//             creep.memory.upgrading = true;
//             creep.say("⚡ upgrade");
//         }

//         if (creep.memory.upgrading) {
//             const controller = creep.room.controller;

//             if (controller) {
//                 if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
//                     creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffffff" } });
//                 }
//             }
//         } else {
//             const sources = creep.room.find(FIND_SOURCES);
//             if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
//                 creep.moveTo(sources[0], { visualizePathStyle: { stroke: "#ffaa00" } });
//             }
//         }
//     },
//     numUpgraders(room, numHarvesters) {
//         // TODO: make based on an actual provided creep count
//         const maxUpgraders = 5;
//         let numUpgraders = maxUpgraders;
//         let creepsInRoomTotal = 0;

//         for (const creepsKey in Game.creeps) {
//             if (Game.creeps[creepsKey].room === room) {
//                 creepsInRoomTotal++;
//             }
//         }

//         numUpgraders -= Math.floor((creepsInRoomTotal - numHarvesters) / 2);
//         numUpgraders = Math.max(numUpgraders, 0);

//         return Math.min(maxUpgraders, numUpgraders);
//     }
// };
