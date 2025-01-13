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
            const target = Game.getObjectById(creep.memory.target as Id<Source>);
            if (!target) {
                console.log(`[${creep.name}] Invalid target: ${creep.memory.target}`);
                delete creep.memory.target; // Clear invalid target
                return;
            }
            actions.mine(creep, target);
        }
    },

};
