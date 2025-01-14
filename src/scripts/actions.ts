import config from "./config";
import _ from "lodash";

const actions = {
    moveToAssignedRoom(creep: Creep): void {
        const assignedRoom = Memory.creeps[creep.name].roomAssignment;
        if (!assignedRoom){
            console.log(`[Move] Error: no assigned room`);
            creep.suicide;
        } else {
        if (creep.room.name !== assignedRoom) {
            // Move to the center of the target room
            const exitDir = creep.room.findExitTo(assignedRoom);
            if (exitDir === ERR_NO_PATH || exitDir === ERR_INVALID_ARGS) {
                console.log(`[${creep.name}] No valid path to room: ${assignedRoom}`);
                creep.memory.state = "idle";
                return;
            }

            const exit = creep.pos.findClosestByPath(exitDir as ExitConstant);
            if (exit) {
                creep.moveTo(exit, { visualizePathStyle: { stroke: config.colors.paths.delivering } });
                creep.say(`➡️ ${assignedRoom}`);
            } else {
                console.log(`[${creep.name}] Could not find an exit to room: ${assignedRoom}`);
                creep.memory.state = "idle";
            }
        }
    }
    },

    /**
     * Upgrade the room controller.
     * @param {Creep} creep - The creep performing the action.
     * @param {StructureController} [target] - The controller to upgrade.
     */
    upgradeController(creep: Creep, target?: StructureController): void {

        this.moveToAssignedRoom(creep);

        const controller = target || creep.room.controller;
        if (!controller) {
            creep.say("❌ No controller");
            creep.memory.state = "idle"
            return;
        }

        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.say("❌ No energy");
            creep.memory.state = "hungry"
            return;
        }

        console.log(`${creep.name} upgrading ${controller}`);

        const result = creep.upgradeController(controller);

        if (result === ERR_NOT_IN_RANGE) {
            const moveResult = creep.moveTo(controller, { visualizePathStyle: { stroke: config.colors.paths.upgrading },});
            creep.memory.state = "moving";
            if (moveResult !== OK) {
                console.log(`${creep.name} failed to move to controller: ${moveResult}`);
                creep.memory.state = "idle";
            }
        } else if (result !== OK) {
            console.log(`${creep.name} failed to upgrade controller: ${result}`);
            creep.memory.state = "idle";
        }
    },

    /**
     * Pick up energy from the ground or containers/storage if none is available on the ground.
     * @param {Creep} creep - The creep performing the action.
     * @param {Resource | StructureContainer | StructureStorage} [target] - The target to pick up energy from.
     */
    pickupEnergy(creep: Creep, target?: Resource | StructureContainer | StructureStorage): void {
        this.moveToAssignedRoom(creep);
        if (target instanceof Resource) {
            if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: config.colors.paths.pickingUp } });
                creep.memory.state = "moving";
            }
            return;
        }

        if (
            target instanceof StructureContainer ||
            target instanceof StructureStorage
        ) {
            if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: config.colors.paths.pickingUp } });
                creep.memory.state = "moving";
            }
            return;
        }

        // Default behavior: Find dropped resources or containers
        const droppedResources = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: resource => resource.resourceType === RESOURCE_ENERGY,
        });

        if (droppedResources.length > 0) {
            this.pickupEnergy(creep, droppedResources[0]);
        } else {
            const containers = creep.room.find(FIND_STRUCTURES, {
                filter: structure =>
                    (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) &&
                    structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0,
            });

            if (containers.length > 0) {
                this.pickupEnergy(creep, containers[0] as StructureContainer | StructureStorage);
            } else {
                creep.say("❌ No energy sources");
                creep.memory.state = "idle";
            }
        }
    },


    // REWRITE TO USE MEMORY FOR CONTAINERS AND ASSIGNED CREEPS
    mineInContainer(creep: Creep): void {
        this.moveToAssignedRoom(creep);
        if (!creep.memory.container) {
            // Search for containers near sources with no assigned creeps
            const roomSources = creep.room.find(FIND_SOURCES);

            for (const source of roomSources) {
                const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
                    filter: structure => structure.structureType === STRUCTURE_CONTAINER,
                });

                for (const container of containers) {
                    const isContainerOccupied = _.some(Game.creeps, otherCreep => {
                        return (
                            otherCreep.memory.container === container.id &&
                            otherCreep.memory.role === "miner"
                        );
                    });

                    if (!isContainerOccupied) {
                        creep.memory.container = container.id;
                        console.log(`[${creep.name}] Assigned to container: ${container.id}`);
                        break;
                    }
                }

                if (creep.memory.container) {
                    break; // Stop searching once assigned to a container
                }
            }

            if (!creep.memory.container) {
                console.log(`[${creep.name}] No unoccupied containers available, switching to normal mining.`);
                this.mine(creep);
                return;
            }
        }

        // Move to assigned container and start mining
        const container = Game.getObjectById(creep.memory.container as Id<StructureContainer>);
        if (!container) {
            console.log(`[${creep.name}] Invalid container assignment. Clearing memory.`);
            delete creep.memory.container;
            return;
        }

        if (!creep.pos.isEqualTo(container.pos)) {
            creep.moveTo(container, { visualizePathStyle: { stroke: "#ffaa00" } });
            creep.memory.state = "moving";
            creep.say("📦 Moving to container");
        } else {
            const source = container.pos.findInRange(FIND_SOURCES, 1)[0];
            if (source) {
                const result = creep.harvest(source);
                if (result !== OK) {
                    console.log(`[${creep.name}] Failed to harvest: ${result}`);
                    creep.memory.state = "idle";
                }
            } else {
                console.log(`[${creep.name}] No source near container: ${container.id}`);
            }
        }
    },

    /**
    * Mine energy from a source, prioritizing standing on a container adjacent to the source.
    * @param {Creep} creep - The creep performing the action.
    * @param {Source} [target] - The source to mine.
    */

    mine(creep: Creep, target?: Source): void {
        const roomMemory = Memory.rooms[creep.room.name];

        let sourcesWithFreeVacanciesOrContainers: StructureMemory[] = [];

        if (roomMemory && roomMemory.structures) {
            sourcesWithFreeVacanciesOrContainers = Object.values(roomMemory.structures)
                .filter(structure => structure.type === "source") // Filter for sources
                .filter(source => {
                    const hasFreeVacancies = (source.vacancies || 0) > ((source.creeps?.length || 0));
                    const hasFreeContainers = (source.containers || []).some(containerId => {
                        return !Object.values(Game.creeps).some(creep => creep.memory.container === containerId);
                    });
                    return hasFreeVacancies || hasFreeContainers;
                });
        }

        if (!creep.memory.target) {
            for (const sourceMemory of sourcesWithFreeVacanciesOrContainers) {
                if (!sourceMemory.creeps.includes(creep.name)) {
                    creep.memory.target = sourceMemory.id;
                    sourceMemory.creeps.push(creep.name); // Add creep to source memory
                    roomMemory.structures[sourceMemory.id] = sourceMemory; // Persist memory changes
                    console.log(`[${creep.name}] Assigned to source: ${sourceMemory.id}`);
                    creep.memory.state = "mining";
                    break; // Assign only one source
                }
            }
        }

        if (!creep.memory.target) {
            creep.say("❌ No source");
            creep.memory.state = "idle";
            return;
        }

        const targetSource = Game.getObjectById(creep.memory.target as Id<Source>);
        if (!targetSource) {
            console.log(`[${creep.name}] Invalid target source: ${creep.memory.target}`);
            delete creep.memory.target;
            creep.memory.state = "idle";
            return;
    }

    const MiningResult = creep.harvest(targetSource);

    if (MiningResult == ERR_NOT_IN_RANGE){
        creep.moveTo(targetSource, { visualizePathStyle: { stroke: config.colors.paths.delivering } });
        creep.say("🚶 Moving to vacancy");
        creep.memory.state = "moving"
        return;
    }

    if (MiningResult !== OK) {
        console.log(`${creep.name} failed to mine: ${MiningResult}`);
        creep.memory.state = "idle"
    }
    },

    /**
     * Deliver energy to a structure.
     * @param {Creep} creep - The creep performing the action.
     * @param {Structure} [target] - The target structure to supply energy to.
     */
    supply(creep: Creep, target?: Structure): void {
        this.moveToAssignedRoom(creep);
        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: config.colors.paths.delivering } });
            }
            return;
        }

        const targets = creep.room.find(FIND_MY_STRUCTURES, {
            filter: structure =>
                (structure.structureType === STRUCTURE_SPAWN ||
                structure.structureType === STRUCTURE_EXTENSION ||
                structure.structureType === STRUCTURE_TOWER) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
        });

        if (targets.length > 0) {
            this.supply(creep, targets[0]);
        } else {
            creep.say("💤 Going idle");
            Memory.creeps[creep.name].state = "idle";
            const flag = Game.flags["AFKzone"];
        // THIS SHIULD BE DIFFERENT
            if (flag) {
            Object.values(Game.creeps).forEach(creep => {
                if(creep.memory.state === "idle"){
                    this.goIdle(creep, flag);
                }
            });
        }
        }
    },

    /**
     * Build a construction site.
     * @param {Creep} creep - The creep performing the action.
     * @param {ConstructionSite} [target] - The construction site to build.
     */
    build(creep: Creep, target?: ConstructionSite): void {
        this.moveToAssignedRoom(creep);
        if (target) {
            if (creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: config.colors.paths.upgrading } });
            }
            return;
        }

        const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);

        if (constructionSites.length > 0) {
            this.build(creep, constructionSites[0]);
        } else {
            creep.say("❌ No construction sites");
        }
    },

    /**
     * Repair a damaged structure.
     * @param {Creep} creep - The creep performing the action.
     * @param {Structure} [target] - The structure to repair.
     */
    repair(creep: Creep, target?: Structure): void {
        this.moveToAssignedRoom(creep);
        if (target) {
            if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: config.colors.paths.repairing } });
            }
            return;
        }

        const damagedStructures = creep.room.find(FIND_STRUCTURES, {
            filter: structure => structure.hits < structure.hitsMax,
        });

        if (damagedStructures.length > 0) {
            const mostDamaged = _.min(damagedStructures, 'hits') as Structure;
            this.repair(creep, mostDamaged);
        } else {
            creep.say("❌ No repairs needed");
        }
    },

    goIdle(creep: Creep, flag: Flag): void {
        if (!flag.memory.assignedPositions) {
            console.log(`Flag ${flag.name} has no assigned positions. Calculating now.`);
        }

        const assignedPositions = flag.memory.assignedPositions;

        // Find vacant positions (not occupied by any creep)
        const vacantPositions = assignedPositions!.filter(pos => {
            return !Object.values(Game.creeps).some(otherCreep => {
                return (
                    otherCreep.memory.position &&
                    otherCreep.memory.position.x === pos.x &&
                    otherCreep.memory.position.y === pos.y
                );
            });
        });

        // Assign the first available position to the creep
        if (!creep.memory.position && vacantPositions.length > 0) {
            const assignedPosition = vacantPositions[0];
            creep.memory.position = { ...assignedPosition};
            console.log(`[${creep.name}] Assigned to position at (${assignedPosition.x}, ${assignedPosition.y}) for flag ${flag.name}`);
        }

        // Move the creep to its assigned position
        if (creep.memory.position) {
            const targetPos = new RoomPosition(
                creep.memory.position.x,
                creep.memory.position.y,
                creep.room.name
            );

            if (!creep.pos.isEqualTo(targetPos) && Memory.creeps[creep.name].state === "idle") {
                creep.moveTo(targetPos, { visualizePathStyle: { stroke: "#ffaa00" } });
                creep.say("🚶 Moving to idle");
            }
        }
    },


};


export default actions;
