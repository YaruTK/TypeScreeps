import actions from "../scripts/actions";
import config from "scripts/config";

let roleSlave: {
    /**
     * @param {Creep} creep
     */
    run(creep: Creep): void;
    assignSlaveSubRoles(): void;
    slavesNeeded(): number;
};

type SubRole = "repairer" | "wallRepairer" | "builder" | "upgrader";
let slaveNumber = 0;

export default roleSlave = {
        run(creep: Creep) {
            // Ensure subRole is assigned
            if (!creep.memory.subRole) {
                this.assignSlaveSubRoles();
            }

            const damagedStructures = creep.room.find(FIND_STRUCTURES, {
                filter: structure =>
                    structure.hits < structure.hitsMax &&
                    structure.structureType !== STRUCTURE_WALL,
            });

            const damagedWalls = creep.room.find(FIND_STRUCTURES, {
                filter: structure =>
                    structure.hits < structure.hitsMax &&
                    structure.structureType === STRUCTURE_WALL,
            });

            const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);

        // State transitions: picking up or supplying
        if (creep.memory.pickingUp && creep.store.getFreeCapacity() === 0) {
            creep.memory.pickingUp = false;
            creep.say("♿ Working");
        }
        if (!creep.memory.pickingUp && creep.store.getUsedCapacity() === 0) {
            creep.memory.pickingUp = true;
            creep.say("⬆ Picking Up");
        }


        // Handle picking up energy
        if (creep.memory.pickingUp) {
            actions.pickupEnergy(creep);
        } else {
            // Execute actions based on the subRole
            switch (creep.memory.subRole) {
                case "repairer":
                    if (damagedStructures.length > 0) {
                        const target = _.min(damagedStructures, "hits") as Structure;
                        actions.repair(creep, target);
                    } else {
                        creep.say("❌ No repairs needed");
                    }
                    break;

                case "wallRepairer":
                    if (damagedWalls.length > 0) {
                        const target = _.min(damagedWalls, "hits") as Structure;
                        actions.repair(creep, target);
                    } else {
                        creep.say("❌ No wall repairs needed");
                    }
                    break;
                case "builder":
                    if (constructionSites.length > 0) {
                        const target = constructionSites[0];
                        actions.build(creep, target)
                    } else {
                        creep.say("❌ No construction sites");
                    }
                    break;
                case "upgrader":
                    actions.upgradeController(creep);
                    break;
                default:
                    console.log(`[${creep.name}] Invalid or missing subRole.`);
            }
        }
        },

        assignSlaveSubRoles() {
            const allSlaves = _.filter(Game.creeps, creep => creep.memory.role === config.roles.slave.role);
            if (allSlaves.length === 0) {
                console.log("No slaves available to assign subRoles.");
                return;
            }

            const room = allSlaves[0].room;

            // Define subRole counts
            const subRoleCounts: Record<SubRole, number> = {
                repairer: 0,
                wallRepairer: 0,
                builder: 0,
                upgrader: 0,
            };

            // Count existing subRoles
            allSlaves.forEach(creep => {
                const subRole = creep.memory.subRole as SubRole;
                if (subRole && subRole in subRoleCounts) {
                    subRoleCounts[subRole] += 1;
                }
            });

            const constructionSites = room.find(FIND_CONSTRUCTION_SITES);

            const damagedStructures = room.find(FIND_STRUCTURES, {
                filter: structure =>
                    structure.hits < structure.hitsMax &&
                    structure.structureType !== STRUCTURE_WALL,
            });

            const damagedWalls = room.find(FIND_STRUCTURES, {
                filter: structure =>
                    structure.hits < structure.hitsMax &&
                    structure.structureType === STRUCTURE_WALL,
            });

            // Desired distribution of slaves
            const repWalls = damagedWalls.length || 0;
            const repStructs = damagedStructures.length || 0;
            const constSites = constructionSites.length || 0;
            const defUpgraders = config.roles.slave.defaultUpgraderCount;

            const desiredDistribution: Record<SubRole, number> = {
                wallRepairer: repWalls,
                repairer: repStructs,
                builder: constSites,
                upgrader: config.roles.slave.defaultUpgraderCount, // Default number of upgraders
            };

            slaveNumber += repWalls + repStructs + constSites + defUpgraders;

            // Reassign subRoles if needed
            allSlaves.forEach(creep => {
                const currentSubRole = creep.memory.subRole as SubRole;
                if (
                    !currentSubRole ||
                    subRoleCounts[currentSubRole] > desiredDistribution[currentSubRole]
                ) {
                    // Find the least-represented subRole
                    const newSubRole = Object.entries(desiredDistribution)
                        .sort(([, countA], [, countB]) => countA - countB)
                        .find(([role, count]) => subRoleCounts[role as SubRole] < count)?.[0] as SubRole;

                    if (newSubRole) {
                        // Assign new subRole
                        creep.memory.subRole = newSubRole;
                        subRoleCounts[newSubRole] += 1;
                        console.log(`[Assign] ${creep.name} assigned to subRole: ${newSubRole}`);
                    }
                }
            });
        },

        slavesNeeded() {
            return slaveNumber;
        },

};
