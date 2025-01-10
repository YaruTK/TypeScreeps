import * as _ from "lodash";
import memoryCreep from "./memory.creep";
import roleMiner from "../behaviour/miner";

let spawnCreeps: {
    spawn(spawn: StructureSpawn): void;
};

export default spawnCreeps = {
    spawn(spawn) {
        /**
         * Add a creep to a source in memory.
         * @param {Creep} creep - The creep to assign.
         * @param {Source} source - The source to assign the creep to.
         */
        function addCreepToSource(creep: Creep, source: Source): void {
            const roomMemory = Memory.rooms[creep.room.name];
            if (!roomMemory) {
                console.log(`[${creep.name}] Room memory is not initialized.`);
                return;
            }

            const sourceMemory = roomMemory.sources[source.id];
            if (!sourceMemory) {
                console.log(`[${creep.name}] Source ${source.id} is not in room memory.`);
                return;
            }

            // Assign creep to the source
            sourceMemory.creeps.push(creep.name);
            creep.memory.target = source.id;
            console.log(`[${creep.name}] Assigned to source: ${source.id}`);
        }

        // Find all miners in the room
        const miners = _.filter(Game.creeps, creep => creep.memory.role === memoryCreep.MINER);

        // Determine the required number of miners
        const requiredMiners = roleMiner.numMiners(spawn.room);

        // Spawn miners if needed
        if (miners.length < requiredMiners) {
            const newName = "Miner" + Game.time;
            console.log(`Spawning new miner: ${newName}`);

            // Find a source with vacancies
            const roomMemory = Memory.rooms[spawn.room.name];
            const availableSource = Object.values(roomMemory.sources)
                .find(source => source.vacancies > source.creeps.length);

            if (availableSource) {
                const spawnResult = spawn.spawnCreep([WORK, WORK, MOVE], newName, {
                    memory: {
                        id: newName,
                        role: memoryCreep.MINER },
                });

                if (spawnResult === OK) {
                    console.log(`[${newName}] Successfully spawned.`);
                    const newCreep = Game.creeps[newName];
                    if (newCreep) {
                        addCreepToSource(newCreep, Game.getObjectById(availableSource.id)!);
                    }
                } else {
                    console.log(`[${newName}] Spawn failed with error: ${spawnResult}`);
                }
            } else {
                console.log("No available sources with vacancies for new miners.");
            }
        }

        // Display spawning progress visually
        if (spawn.spawning) {
            const spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                `🛠️ ${spawningCreep.memory.role}`,
                spawn.pos.x + 1,
                spawn.pos.y,
                { align: "left", opacity: 0.8 }
            );
        }
    }
};
