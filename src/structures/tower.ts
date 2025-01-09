let structureTowers: {
    run(towers: StructureTower[]): void;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default structureTowers = {
    run(towers) {
        towers.forEach(tower => {
            const closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: structure => structure.hits < structure.hitsMax
            });
            if (closestDamagedStructure) {
                tower.repair(closestDamagedStructure);
            }

            const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (closestHostile) {
                tower.attack(closestHostile);
            }
        });
    }
};
