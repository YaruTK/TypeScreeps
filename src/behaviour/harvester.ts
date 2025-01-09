let roleHarvester: {
    run(creep: Creep): void
}

export default roleHarvester = {
    /**
     * @param {Creep} creep
     */
    run: function(creep :Creep) :void {
	    if(creep.store.getFreeCapacity() > 0) {
            const sources :(Source)[]= creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else {
            const targets  = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure :AnyStructure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
            });
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
	}
}