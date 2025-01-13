import _ from "lodash";
import actions from "../scripts/actions"

let roleMiner: {
    /**
     * @param {Creep} creep
     */
    run(creep: Creep): void;
};

export default roleMiner = {
    run(creep: Creep) {
        // Ensure the creep has a target assigned
        if (!creep.memory.target) {
            // Assign the creep to a source with vacancies
            const roomMemory = Memory.rooms[creep.room.name];
            const availableSource = Object.values(roomMemory.sources).find(source => {
                return source.vacancies > source.creeps.length;
            });

            if (availableSource) {
                creep.memory.target = availableSource.id;
                roomMemory.sources[availableSource.id].creeps.push(creep.name);
                console.log(`[${creep.name}] Assigned to source: ${availableSource.id}`);
            } else {
                console.log(`[${creep.name}] No available sources with vacancies.`);
                return;
            }
        }

        // Mining logic
        if (creep.memory.target) {
            const targetSource = Game.getObjectById(creep.memory.target as Id<Source>);
            if (!targetSource) {
                console.log(`[${creep.name}] Invalid target: ${creep.memory.target}`);
                delete creep.memory.target; // Clear invalid target
                return;
            }

            // Check for containers near the source
            const containers = targetSource.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: structure => structure.structureType === STRUCTURE_CONTAINER,
            });

            const unoccupiedContainer = containers.find(container => {
                // Ensure no other miner is sitting on this container
                return !_.some(Game.creeps, otherCreep => {
                    return (
                        otherCreep.memory.role === "miner" &&
                        otherCreep.memory.container === container.id
                    );
                });
            });

            if (unoccupiedContainer) {
                // Move to the container and mine from there
                if (!creep.memory.container || creep.memory.container !== unoccupiedContainer.id) {
                    creep.memory.container = unoccupiedContainer.id;
                    console.log(`[${creep.name}] Assigned to container: ${unoccupiedContainer.id}`);
                }

                if (!creep.pos.isEqualTo(unoccupiedContainer.pos)) {
                    creep.moveTo(unoccupiedContainer, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                    });
                } else {
                    actions.mine(creep, targetSource);
                }
            } else {
                // If no container is available, mine from a free vacancy
                console.log(`[${creep.name}] No containers available, mining at free vacancy.`);
                actions.mine(creep, targetSource);
            }
        }
    },
};
