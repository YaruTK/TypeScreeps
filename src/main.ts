import { ErrorMapper } from "utils/ErrorMapper";

import MemoryRole from "./behaviour/memory.creep";
import roleBuilder from "./behaviour/builder";
import roleHarvester from "./behaviour/harvester";
import roleUpgrader from "./behaviour/upgrader";
import spawnCreeps from "./scripts/spawn.creep";
import structureTower from "./structures/tower";

// import * as _ from 'lodash';

export function loop() {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log("Clearing non-existing creep memory:", name);
        }
    }

    const myStructureKeys = Object.keys(Game.structures);
    const myStructures: Structure<StructureConstant>[] = myStructureKeys.map(key => Game.structures[key]);

    const spawns: StructureSpawn[] = [];
    const towers: StructureTower[] = [];

    for (const struct of myStructures) {
        if (struct.structureType === STRUCTURE_SPAWN) {
            spawns.push(struct as StructureSpawn);
        }
        if (struct.structureType === STRUCTURE_TOWER) {
            towers.push(struct as StructureTower);
        }
    }

    spawns.forEach(spawn => {
        spawnCreeps.spawn(spawn);
    });
    structureTower.run(towers);

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role === MemoryRole.HARVESTER.valueOf()) {
            roleHarvester.run(creep);
        }
        if (creep.memory.role === MemoryRole.BUILDER.valueOf()) {
            roleBuilder.run(creep);
        }
        if (creep.memory.role === MemoryRole.UPGRADER.valueOf()) {
            roleUpgrader.run(creep);
        }
    }
}
