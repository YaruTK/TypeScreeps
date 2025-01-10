let roleMiner: {
    /**
     * @param {Creep} creep
     */
    run(creep: Creep): void;
    numMiners(room: Room): number;
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
            const target = Game.getObjectById(creep.memory.target as Id<Source>);
            if (!target) {
                console.log(`[${creep.name}] Invalid target: ${creep.memory.target}`);
                delete creep.memory.target; // Clear invalid target
                return;
            }

            // Move to the assigned source and harvest
            const harvestResult = creep.harvest(target);
            if (harvestResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
                console.log(`[${creep.name}] Moving to source: ${target.id}`);
            } else if (harvestResult === OK) {
                // Mining is successful; log debug info
                console.log(`[${creep.name}] Mining at source: ${target.id}`);
            } else {
                console.log(`[${creep.name}] Harvest error: ${harvestResult}`);
            }
        }
    },

    // Calculate the number of miners needed based on sources in the room
    numMiners(room: Room): number {
        const roomMemory = Memory.rooms[room.name];
        if (roomMemory) {
            const totalVacancies = Object.values(roomMemory.sources).reduce(
                (sum, source) => sum + Math.max(0, source.vacancies - source.creeps.length),
                0
            );
            return totalVacancies;
        }
        return 0;
    },
};
