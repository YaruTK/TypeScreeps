let roleHarvester: {
    /**
    * @param {Creep} creep
    */
    run(creep: Creep): void;
    numHarvesters(room: Room): number;
};

export default roleHarvester = {
    run(creep) {
        function getSourceInstance(target: Id<Source>): Source | null {
            const result = Game.getObjectById(target);

            if (result instanceof Source) {
                return result;
            }

            return null;
        }

        function getStructureInstance(
            target: Id<_HasId> | undefined
        ): StructureExtension | StructureSpawn | StructureTower | StructureStorage | StructureContainer | null {
            if (target === undefined) {
                target = "" as Id<_HasId>;
            }

            const result = Game.getObjectById(target);

            if (result instanceof StructureExtension) {
                return result;
            }
            if (result instanceof StructureSpawn) {
                return result;
            }
            if (result instanceof StructureTower) {
                return result;
            }
            if (result instanceof StructureStorage) {
                return result;
            }
            if (result instanceof StructureContainer) {
                return result;
            }
            return null;
        }

        function findSource(): Id<Source> {
            const sources = creep.room.find(FIND_SOURCES);
            const sourceIndex = Math.floor(Math.random() * sources.length);

            return sources[sourceIndex].id;
        }

        function findTarget(): Id<_HasId> {
            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: structure => {
                    return (
                        (structure.structureType === STRUCTURE_EXTENSION ||
                            structure.structureType === STRUCTURE_SPAWN ||
                            structure.structureType === STRUCTURE_TOWER ||
                            structure.structureType === STRUCTURE_STORAGE ||
                            structure.structureType === STRUCTURE_CONTAINER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                }
            });

            const targetsExtentions: AnyStructure[] = [];
            targets.forEach(target => {
                if (target.structureType === STRUCTURE_EXTENSION) {
                    targetsExtentions.push(target);
                }
            });

            const targetSpawns: StructureSpawn[] = [];
            targets.forEach(target => {
                if (target.structureType === STRUCTURE_SPAWN) {
                    targetSpawns.push(target);
                }
            });

            const targetTowers: AnyStructure[] = [];
            targets.forEach(target => {
                if (target.structureType === STRUCTURE_TOWER) {
                    targetTowers.push(target);
                }
            });

            const targetStorages: AnyStructure[] = [];
            targets.forEach(target => {
                if (target.structureType === STRUCTURE_STORAGE) {
                    targetStorages.push(target);
                }
            });

            const targetContainers: AnyStructure[] = [];
            targetContainers.forEach(target => {
                targetContainers.push(target);
            });

            const orderedTargets = [targetsExtentions, targetSpawns, targetTowers, targetStorages, targetContainers];

            let targetIndex = 0;
            let targetId: Id<_HasId> = "" as Id<_HasId>;

            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let i = 0; i < orderedTargets.length; i++) {
                if (orderedTargets[i].length > 0) {
                    targetIndex = Math.floor(Math.random() * orderedTargets[i].length);
                    targetId = orderedTargets[i][targetIndex].id as Id<_HasId>;
                    break;
                }
            }

            return targetId;
        }

        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.harvesting = true;
            creep.say("🔄 harvest");
        }

        if (creep.memory.harvesting && creep.store.getFreeCapacity() === 0) {
            creep.memory.harvesting = false;
            creep.say("🚿 storing");
        }

        if (creep.memory.harvesting) {
            // harvest
            if (!creep.memory.source) {
                creep.memory.source = findSource();
            }

            const target = getSourceInstance(creep.memory.source);

            if (target) {
                if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
                }
            }
        } else {
            let target = getStructureInstance(creep.memory.target);
            // is a target in memory and valid
            if (!target || getStructureInstance(creep.memory.target)?.store.getFreeCapacity() === 0) {
                creep.memory.target = findTarget();
                target = getStructureInstance(creep.memory.target);
            }

            const potentialTarget = getStructureInstance(findTarget());
            if (
                (target?.structureType === STRUCTURE_STORAGE || target?.structureType === STRUCTURE_TOWER) &&
                potentialTarget &&
                potentialTarget.structureType !== STRUCTURE_STORAGE &&
                potentialTarget.structureType !== STRUCTURE_TOWER
            ) {
                target = potentialTarget;
                creep.memory.target = target.id;
            }

            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
                }
            }
        }
    },
    numHarvesters(room): number {
        let numHarvesters: number = 0;
        const sources = room.find(FIND_SOURCES);

        numHarvesters += sources.length * 3;

        return numHarvesters;
    }
};

