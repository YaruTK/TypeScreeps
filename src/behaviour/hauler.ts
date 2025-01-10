import _ from "lodash";

let roleHauler: {
    /**
     * Run logic for hauler creeps.
     * @param {Creep} creep
     */
    run(creep: Creep): void;

    /**
     * Get a prioritized list of structures for depositing energy.
     * Ensures at least one hauler is assigned to each priority point if possible.
     * @param {Room} room
     * @returns {Structure[]}
     */
    getPriorityStructures(room: Room): Structure[];
};

export default roleHauler = {
    run(creep: Creep) {
        const roomMemory = Memory.rooms[creep.room.name];
        if (!roomMemory) {
            console.log(`[${creep.name}] No memory for room: ${creep.room.name}`);
            return;
        }

        // Determine if the hauler is picking up or delivering energy
        if (creep.memory.pickingUp && creep.store.getFreeCapacity() === 0) {
            creep.memory.pickingUp = false;
            creep.say("🔄 Delivering");
        }
        if (!creep.memory.pickingUp && creep.store.getUsedCapacity() === 0) {
            creep.memory.pickingUp = true;
            creep.say("🔄 Picking Up");
        }

        if (creep.memory.pickingUp) {
            // Find dropped energy
            const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: resource => resource.resourceType === RESOURCE_ENERGY,
            });

            if (droppedEnergy.length === 0) {
                creep.say("🔄 No energy");
                return;
            }

            // Choose the source with the fewest assigned haulers
            let target: Resource<ResourceConstant> | null = null;
            let minHaulers = Infinity;

            for (const resource of droppedEnergy) {
                const sourceMemory = roomMemory.sources[resource.id];
                const assignedHaulers = sourceMemory?.creeps.filter(name => Game.creeps[name]?.memory.role === "hauler").length || 0;

                if (assignedHaulers < minHaulers) {
                    minHaulers = assignedHaulers;
                    target = resource;
                }
            }

            if (target) {
                if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
                }
            }
        } else {
            // Deliver energy to the highest-priority structure

            const priorityStructures = this.getPriorityStructures(creep.room).filter(
                (structure): structure is StructureSpawn | StructureExtension | StructureTower | StructureStorage =>
                    "store" in structure
            );

            const target = priorityStructures.find(
                (structure) => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );

            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
                }
            } else {
                creep.say("🔄 No target");
            }
        }
    },

    getPriorityStructures(room: Room): Structure[] {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory) return [];

        const structures = room.find(FIND_MY_STRUCTURES, {
            filter: structure =>
                structure.structureType === STRUCTURE_SPAWN ||
                structure.structureType === STRUCTURE_EXTENSION ||
                structure.structureType === STRUCTURE_TOWER ||
                structure.structureType === STRUCTURE_STORAGE,
        });

        const priorityOrder = {
            [STRUCTURE_SPAWN]: 1,
            [STRUCTURE_EXTENSION]: 2,
            [STRUCTURE_TOWER]: 3,
            [STRUCTURE_STORAGE]: 4,
        };

        // Ensure each priority structure has at least one hauler
        structures.forEach(structure => {
            const structureMemory = roomMemory.structures[structure.id];
            const assignedHaulers = structureMemory?.creeps.filter(name => Game.creeps[name]?.memory.role === "hauler").length || 0;

            if (assignedHaulers === 0) {
                // Assign an idle hauler to this structure if possible
                const idleHauler = _.find(Game.creeps, creep => {
                    return creep.memory.role === "hauler" && !creep.memory.target;
                });

                if (idleHauler) {
                    idleHauler.memory.target = structure.id;
                    structureMemory.creeps.push(idleHauler.name);
                    console.log(`[${idleHauler.name}] Assigned to priority structure: ${structure.id}`);
                }
            }
        });

        // Sort structures by priority: Spawn > Extension > Tower > Storage
        return structures.sort((a, b) => {
            return (priorityOrder[a.structureType] || 99) - (priorityOrder[b.structureType] || 99);
        });
    },
};
