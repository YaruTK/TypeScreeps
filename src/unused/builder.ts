// let roleBuilder: {
//     /**
//      * @param {Creep} creep
//      */
//     run(creep: Creep): void;
//     numBuilders(room: Room): number;
// }

// export default roleBuilder = {
//     run(creep) {
//         if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
//             creep.memory.building = false;
//             creep.say("🔄 harvest");
//         }
//         if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
//             creep.memory.building = true;
//             creep.say("🚧 build");
//         }

//         if (creep.memory.building) {
//             const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
//             if (targets.length) {
//                 if (creep.build(targets[0]) === ERR_NOT_IN_RANGE) {
//                     creep.moveTo(targets[0], { visualizePathStyle: { stroke: "#ffffff" } });
//                 }
//             }
//         } else {
//             const sources = creep.room.find(FIND_SOURCES);
//             if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
//                 creep.moveTo(sources[0], { visualizePathStyle: { stroke: "#ffaa00" } });
//             }
//         }
//     },
//     numBuilders(room) {
//         let numBuilders = 0;
//         const maxBuilders = 5;

//         const targets = room.find(FIND_CONSTRUCTION_SITES);

//         numBuilders += Math.ceil(targets.length / 5);

//         let accumulatedConstructionCost = 0;
//         targets.forEach(target => {
//             accumulatedConstructionCost += target.progressTotal - target.progress;
//         });

//         numBuilders += Math.floor(accumulatedConstructionCost / 1500);

//         return numBuilders <= maxBuilders ? numBuilders : maxBuilders;
//     }
// };

