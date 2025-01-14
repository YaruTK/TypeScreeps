import actions from "../scripts/actions";
import config from "scripts/config";
import _ from "lodash";

let roleSlave: {
    /**
     * @param {Creep} creep
     */
    run(creep: Creep): void;
    assignSlaveSubRoles(): void;
    subRolesNeeded(): Record<SubRole, number>;
    slavesNeeded(): number;
};

type SubRole = "repairer" | "wallRepairer" | "builder" | "upgrader";

export default roleSlave = {
        run(creep: Creep) {
            // Ensure subRole is assigned
            this.assignSlaveSubRoles();


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
        if (creep.memory.state === "pickingUp" && creep.store.getFreeCapacity() === 0) {
            creep.memory.state = "working";
            creep.say("♿ Working");
        }
        if (creep.memory.state !== "pickingUp" && creep.store.getUsedCapacity() === 0) {
            creep.memory.state = "pickingUp";
            creep.say("⬆ Picking Up");
        }


        // Handle picking up energy
        if (creep.memory.state === "pickingUp") {
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
                        creep.memory.state = "idle"
                    }
                    break;

                case "wallRepairer":
                    if (damagedWalls.length > 0) {
                        const target = _.min(damagedWalls, "hits") as Structure;
                        actions.repair(creep, target);
                    } else {
                        creep.say("❌ No wall repairs needed");
                        creep.memory.state = "idle"
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


            // Desired distribution of slaves
            const desiredDistribution: Record<SubRole, number> = this.subRolesNeeded();

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

        subRolesNeeded(): Record<SubRole, number> {
            const room = Game.rooms[Object.keys(Game.rooms)[0]]; // Replace with a proper room selection
            if (!room) {
                console.error("No accessible rooms found.");
                return {
                    repairer: 0,
                    wallRepairer: 0,
                    builder: 0,
                    upgrader: 0,
                };
            }

            const constructionSites = room.find(FIND_CONSTRUCTION_SITES).length;

            const criticalStructure = room.find(FIND_STRUCTURES, {
                filter: structure =>
                    structure.hits < structure.hitsMax * config.general.repairThreshold &&
                    structure.structureType !== STRUCTURE_WALL,
            }).length;

            const damagedWalls = room.find(FIND_STRUCTURES, {
                filter: structure =>
                    structure.hits < structure.hitsMax &&
                    structure.structureType === STRUCTURE_WALL,
            }).length;

            let wallsRepairs = 0;
            let structRepairs = 0;

            // Determine wall repairer count
            if (!config.general.repairWalls) {
                wallsRepairs = 0; // Wall repair disabled in config
            } else {
                wallsRepairs = Math.min(damagedWalls, 1); // Only 1 wall repairer if walls are damaged
            }

            // Determine structure repairer count
            if (criticalStructure > 0) {
                structRepairs = 2; // Require 1 repairer if a critical structure exists
            } else {
                structRepairs = 0; // No repairer needed otherwise
            }

            // Calculate builder and upgrader counts
            const buildersNeeded = Math.min(constructionSites, 3); // Cap builders at 3
            const upgradersNeeded = config.roles.slave.defaultUpgraderCount; // Default upgrader count from config

            return {
                repairer: structRepairs,
                wallRepairer: wallsRepairs,
                builder: buildersNeeded,
                upgrader: upgradersNeeded,
            };
        },

        slavesNeeded(): number {
            const subRoleCounts = this.subRolesNeeded();
            const totalSlavesNeeded = Object.values(subRoleCounts).reduce((sum, count) => sum + count, 0);

            return totalSlavesNeeded;
        },

};
