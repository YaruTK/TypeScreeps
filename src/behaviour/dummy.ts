import actions from "../scripts/actions"

let roleDummy: {
    /**
     * @param {Creep} creep
     */
    run(creep: Creep): void;
};

export default roleDummy = {
    run(creep: Creep) {
        // Ensure the creep has a target source assigned
        if (!creep.memory.target) {
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

        // Check harvesting state
        if (!creep.memory.mining && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.mining = true;
            creep.say("⛏ Harvesting");
        }

        if (creep.memory.mining && creep.store.getFreeCapacity() === 0) {
            creep.memory.mining = false;
            creep.say("♿ Delivering");
        }

        if (creep.memory.mining) {
            // Mining logic
            const target = Game.getObjectById(creep.memory.target as Id<Source>);
            if (!target) {
                console.log(`[${creep.name}] Invalid target: ${creep.memory.target}`);
                delete creep.memory.target; // Clear invalid target
                return;
            }

            actions.mine(creep, target);

        } else {

            // Delivery logic
            const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
            if (!spawn) {
                console.log(`[${creep.name}] No spawn found in room: ${creep.room.name}`);
                return;
            };

            actions.supply(creep, spawn);
        }
}
}
