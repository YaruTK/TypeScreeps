let roleDummy: {
    /**
     * @param {Creep} creep
     */
    run(creep: Creep): void;
    numDummies(room: Room): number;
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
            creep.say("🔄 harvest");
        }

        if (creep.memory.mining && creep.store.getFreeCapacity() === 0) {
            creep.memory.mining = false;
            creep.say("🚿 storing");
        }

        if (creep.memory.mining) {
            // Mining logic
            const target = Game.getObjectById(creep.memory.target as Id<Source>);
            if (!target) {
                console.log(`[${creep.name}] Invalid target: ${creep.memory.target}`);
                delete creep.memory.target; // Clear invalid target
                return;
            }

            const harvestResult = creep.harvest(target);
            if (harvestResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
                console.log(`[${creep.name}] Moving to source: ${target.id}`);
            } else if (harvestResult === OK) {
                console.log(`[${creep.name}] Mining at source: ${target.id}`);
            } else {
                console.log(`[${creep.name}] Mining error: ${harvestResult}`);
            }
        } else {
            // Delivery logic
            const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
            if (!spawn) {
                console.log(`[${creep.name}] No spawn found in room: ${creep.room.name}`);
                return;
            }

            const transferResult = creep.transfer(spawn, RESOURCE_ENERGY);
            if (transferResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn, { visualizePathStyle: { stroke: "#ffffff" } });
                console.log(`[${creep.name}] Moving to spawn: ${spawn.id}`);
            } else if (transferResult === OK) {
                console.log(`[${creep.name}] Transferred energy to spawn: ${spawn.id}`);
            } else {
                console.log(`[${creep.name}] Transfer error: ${transferResult}`);
            }
        }
},
    // Calculate the number of dummies needed based on sources in the room
    numDummies(room: Room): number {
        return 3;
}
}
