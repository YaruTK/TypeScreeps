import { ErrorMapper } from "utils/ErrorMapper";

import roleHarvester from './behaviour/harvester';
import roleBuilder from './behaviour/builder';
import roleUpgrader from './behaviour/upgrader';
import memoryCreep from 'memory.creep';
import * as _ from 'lodash';


export function loop() : void {



  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name)
    }

  const harvesters :(Creep)[] = _.filter(Game.creeps, (creep: Creep) : boolean => creep.memory.role == memoryCreep.HARVESTER);
    if (harvesters.length < 2) {
      const newName: string = 'Harvester' + Game.time;
      console.log('Spawning new harvester' + newName)
      Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName, {memory: {role: memoryCreep.HARVESTER}});
    }
/*
    if (Game.spawns['Spawn1'].spawning) {
      const spawningCreep = Game.creeps.[Game.spawns['Spawn1'].spawning.name];
      Game.spawns['Spawn1'].room.visual.text(
        text:
      )
    }
*/
    for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if(creep.memory.role == 'harvester') {
        roleHarvester.run(creep);
    }
    if(creep.memory.role == 'upgrader') {
        roleUpgrader.run(creep);
    }
    if(creep.memory.role == 'builder') {
        roleBuilder.run(creep);
    }
}
}
}
