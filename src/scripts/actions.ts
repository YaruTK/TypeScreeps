import config from "./config";

const actions = {
    /**
     * Upgrade the room controller.
     * @param {Creep} creep - The creep performing the action.
     * @param {StructureController} [target] - The controller to upgrade.
     */

    upgradeController(creep: Creep, target?: StructureController): void {
        const controller = target || creep.room.controller;

        if (!controller) {
            creep.say("❌ No controller");
            return;
        }

        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.say("❌ No energy");
            return;
        }

        console.log(`${creep.name} upgrading ${controller}`);

        const result = creep.upgradeController(controller);

        if (result === ERR_NOT_IN_RANGE) {
            const moveResult = creep.moveTo(controller, { visualizePathStyle: { stroke: config.colors.paths.upgrading },});
            if (moveResult !== OK) {
                console.log(`${creep.name} failed to move to controller: ${moveResult}`);
            }
        } else if (result !== OK) {
            console.log(`${creep.name} failed to upgrade controller: ${result}`);
        }
    },

    /**
     * Pick up energy from the ground or containers/storage if none is available on the ground.
     * @param {Creep} creep - The creep performing the action.
     * @param {Resource | StructureContainer | StructureStorage} [target] - The target to pick up energy from.
     */
    pickupEnergy(creep: Creep, target?: Resource | StructureContainer | StructureStorage): void {
        if (target instanceof Resource) {
            if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: config.colors.paths.pickingUp } });
            }
            return;
        }

        if (
            target instanceof StructureContainer ||
            target instanceof StructureStorage
        ) {
            if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: config.colors.paths.pickingUp } });
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
            }
        }
    },

    /**
     * Mine energy from a source, prioritizing standing on a container adjacent to the source.
     * @param {Creep} creep - The creep performing the action.
     * @param {Source} [target] - The source to mine.
     */
    mine(creep: Creep, target?: Source): void {
        const source = target || creep.pos.findClosestByPath(FIND_SOURCES);

        if (!source) {
            creep.say("❌ No source");
            return;
        }

        const containers = creep.room.find(FIND_STRUCTURES, {
            filter: structure =>
                structure.structureType === STRUCTURE_CONTAINER &&
                structure.pos.inRangeTo(source.pos, 1),
        });

        if (containers.length > 0) {
            const container = containers[0];

            if (!creep.pos.isEqualTo(container.pos)) {
                creep.moveTo(container, { visualizePathStyle: { stroke: config.colors.paths.pickingUp } });
                creep.say("📦 Moving to container");
                return;
            }
        }

        const result = creep.harvest(source);
        if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: config.colors.paths.pickingUp } });
        } else if (result !== OK) {
            console.log(`${creep.name} failed to mine: ${result}`);
        }
    },

    /**
     * Deliver energy to a structure.
     * @param {Creep} creep - The creep performing the action.
     * @param {Structure} [target] - The target structure to supply energy to.
     */
    supply(creep: Creep, target?: Structure): void {
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
            creep.say("❌ No supply targets");
        }
    },

    /**
     * Build a construction site.
     * @param {Creep} creep - The creep performing the action.
     * @param {ConstructionSite} [target] - The construction site to build.
     */
    build(creep: Creep, target?: ConstructionSite): void {
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
};

export default actions;
