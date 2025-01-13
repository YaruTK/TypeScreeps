import _ from "lodash";
import actions from "../scripts/actions"

let roleHauler: {
    /**
     * Run logic for hauler creeps.
     * @param {Creep} creep
     */
    run(creep: Creep): void;
};

export default roleHauler = {
    run(creep: Creep) {
        const roomMemory = Memory.rooms[creep.room.name];
        if (!roomMemory) {
            console.log(`[${creep.name}] No memory for room: ${creep.room.name}`);
            return;
        }

        // State transitions: picking up or supplying
        if (creep.memory.pickingUp && creep.store.getFreeCapacity() === 0) {
            creep.memory.pickingUp = false;
            creep.say("♿ Delivering");
        }
        if (!creep.memory.pickingUp && creep.store.getUsedCapacity() === 0) {
            creep.memory.pickingUp = true;
            creep.say("⬆ Picking Up");
        }


        // Handle picking up energy
        if (creep.memory.pickingUp) {
            actions.pickupEnergy(creep);
        } else {
        // Do supply
            actions.supply(creep);
        }
    },
}


    // deliverToSpawn(creep: Creep) {
    //     const target = creep.room.find(FIND_MY_STRUCTURES, {
    //         filter: structure =>
    //             (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION) &&
    //             structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    //     })[0];

    //     if (target) {
    //         if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    //             creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
    //         }
    //     } else {
    //         creep.say("❌ No spawn target");
    //     }
    // },

    // buildOrUpgrade(creep: Creep) {
    //     const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
    //     const controller = creep.room.controller;

    //     if (constructionSites.length > 0) {
    //         if (creep.build(constructionSites[0]) === ERR_NOT_IN_RANGE) {
    //             creep.moveTo(constructionSites[0], { visualizePathStyle: { stroke: "#ffaa00" } });
    //         }
    //     } else if (controller) {
    //         this.upgradeController(creep);
    //     } else {
    //         creep.say("❌ No controller");
    //     }
    // },

    // upgradeController(creep: Creep) {

    //     const controller = creep.room.controller;

    //     if (controller) {

    //         console.log(`${creep.name} upgrading ${controller}`);
    //         const result = creep.upgradeController(controller);

    //         if (result === ERR_NOT_IN_RANGE) {
    //             const moveResult = creep.moveTo(controller, { visualizePathStyle: { stroke: "#ffaa00" } });
    //             if (moveResult !== OK) {
    //                 console.log(`${creep.name} failed to move to controller: ${moveResult}`);
    //             }
    //         } else if (result !== OK) {
    //             console.log(`${creep.name} failed to upgrade controller: ${result}`);
    //         }
    //     } else {
    //         creep.say("❌ No controller");
    //     }
    // },

    // getPriorityStructures(room: Room): Structure<StructureConstant>[] {
    //     const structures = room.find(FIND_MY_STRUCTURES, {
    //         filter: structure =>
    //             structure.structureType === STRUCTURE_SPAWN ||
    //             structure.structureType === STRUCTURE_EXTENSION ||
    //             structure.structureType === STRUCTURE_TOWER ||
    //             structure.structureType === STRUCTURE_STORAGE,
    //     });

    //     const priorityOrder: Record<StructureConstant, number> = {
    //         [STRUCTURE_SPAWN]: 1,
    //         [STRUCTURE_EXTENSION]: 2,
    //         [STRUCTURE_TOWER]: 3,
    //         [STRUCTURE_CONTROLLER]: 4,
    //         [STRUCTURE_CONTAINER]: 5,
    //         [STRUCTURE_STORAGE]: 6,
    //         [STRUCTURE_RAMPART]: 99,
    //         [STRUCTURE_ROAD]: 99,
    //         [STRUCTURE_LINK]: 99,
    //         [STRUCTURE_WALL]: 99,
    //         [STRUCTURE_OBSERVER]: 99,
    //         [STRUCTURE_POWER_SPAWN]: 99,
    //         [STRUCTURE_EXTRACTOR]: 99,
    //         [STRUCTURE_LAB]: 99,
    //         [STRUCTURE_TERMINAL]: 99,
    //         [STRUCTURE_NUKER]: 99,
    //         [STRUCTURE_FACTORY]: 99,
    //         [STRUCTURE_KEEPER_LAIR]: 99,
    //         [STRUCTURE_POWER_BANK]: 99,
    //         [STRUCTURE_INVADER_CORE]: 99,
    //         [STRUCTURE_PORTAL]: 99,
    //     };

    //     return structures.sort((a, b) => (priorityOrder[a.structureType] || 99) - (priorityOrder[b.structureType] || 99));
    // },


    // assignHaulerSubRoles() {

    //     type SubRole = "spawnSupplier" | "upgrader" | "builder";
    //     const allHaulers = _.filter(Game.creeps, creep => creep.memory.role === "hauler");

    //     // Count haulers for each subRole
    //     const subRoleCounts: Record<SubRole, number> = {
    //         spawnSupplier: 0,
    //         upgrader: 0,
    //         builder: 0,

    //     };

    //     allHaulers.forEach(creep => {
    //         if (creep.memory.subRole && creep.memory.subRole in subRoleCounts) {
    //             const subRole = creep.memory.subRole as SubRole; // Ensure TypeScript knows this is a SubRole
    //             subRoleCounts[subRole] += 1;
    //         }
    //     });

    //     // Assign subRoles dynamically if needed
    //     const desiredDistribution: Record<SubRole, number> = {
    //         spawnSupplier: Math.ceil(allHaulers.length / 3),
    //         upgrader: Math.ceil(allHaulers.length / 3),
    //         builder: Math.ceil(allHaulers.length / 3),

    //     };

    //     allHaulers.forEach(creep => {
    //         const currentSubRole = creep.memory.subRole as SubRole;

    //         if (
    //             !currentSubRole ||
    //             subRoleCounts[currentSubRole] > desiredDistribution[currentSubRole]
    //         ) {
    //             // Find the least-represented subRole
    //             const newSubRole = Object.entries(desiredDistribution)
    //                 .sort(([, countA], [, countB]) => countA - countB)
    //                 .find(([role, count]) => subRoleCounts[role as SubRole] < count)?.[0] as SubRole;

    //             if (newSubRole) {
    //                 // Assign new subRole
    //                 creep.memory.subRole = newSubRole;
    //                 subRoleCounts[newSubRole] += 1;
    //                 console.log(`[Assign] ${creep.name} assigned to subRole: ${newSubRole}`);
    //             }
    //         }
    //     });
    // }

