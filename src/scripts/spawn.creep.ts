import _ from "lodash";
import { SpawnQueueManager as SQM } from "./spawn.queue.handler";
import config from "./config";
import roleSlave from "../behaviour/slave";

let spawnCreeps: {
    spawn(spawn: StructureSpawn): void;
    handleLowPopulationSpawning(room: Room, roleCounts: Record<string, number>, totalVacancies: number): void;
    handleSustainedSpawning(room: Room, roleCounts: Record<string, number>, totalVacancies: number): void;
    processSpawnQueue(spawn: StructureSpawn): void;
    getEnergyCost(bodyParts: BodyPartConstant[]): number;
    countCreepsByRole(creeps: { [name: string]: Creep }): Record<string, number>;
    enqueueCreep(room: Room, role: keyof typeof config.roles): void;
};

export default spawnCreeps = {
    spawn(spawn: StructureSpawn) {
        const room = spawn.room;
        const creeps = Game.creeps;

        // Calculate total vacancies
        const totalVacancies = Object.values(Memory.rooms[room.name].sources).reduce(
            (sum, source) => sum + (source.vacancies || 0),
            0
        );

        // Count creeps by role
        const roleCounts = this.countCreepsByRole(creeps);
        const totalCreeps = Object.values(roleCounts).reduce((sum, count) => sum + count, 0);

        // Handle queue capacity
        if (!SQM.isQueueAvailable(room)) {
            console.log(`[SpawnQueue] Queue is full in room ${room.name}.`);
            //why do i do this?
        }

        console.log(`Having ${roleCounts.slave} slaves, should have ${roleSlave.slavesNeeded()}`);

        // Priority spawning logic
        if (roleCounts.miner < 1 && roleCounts.dummy < config.roles.dummy.defaultCount) {
            SQM.clearQueue(room);
            this.enqueueCreep(room, "dummy");
        } else if (totalCreeps < 8) {
            this.handleLowPopulationSpawning(room, roleCounts, totalVacancies);
        } else {
            this.handleSustainedSpawning(room, roleCounts, totalVacancies);
        }

        // Process the spawn queue
        this.processSpawnQueue(spawn);
    },

    handleLowPopulationSpawning(room: Room, roleCounts: Record<string, number>, totalVacancies: number) {
        const roomMemory = Memory.rooms[room.name];
        const containers = Object.values(roomMemory.structures).filter(
            structure => structure.type === STRUCTURE_CONTAINER
        ) || 0;
        if (roleCounts.miner < totalVacancies - 1 && SQM.isQueueAvailable(room)) this.enqueueCreep(room, "miner");
        if (roleCounts.hauler < roleCounts.miner - containers.length && SQM.isQueueAvailable(room)) this.enqueueCreep(room, "hauler");
        if (roleCounts.slave < roleSlave.slavesNeeded() && SQM.isQueueAvailable(room)) this.enqueueCreep(room, "slave");

    },

    handleSustainedSpawning(room: Room, roleCounts: Record<string, number>, totalVacancies: number) {
        const roomMemory = Memory.rooms[room.name];
        const containers = Object.values(roomMemory.structures).filter(
            structure => structure.type === STRUCTURE_CONTAINER
        ) || 0;
        if (roleCounts.slave < roleSlave.slavesNeeded() && SQM.isQueueAvailable(room)) this.enqueueCreep(room, "slave");
        if (roleCounts.hauler < roleCounts.miner - containers.length && SQM.isQueueAvailable(room)) this.enqueueCreep(room, "hauler");
        if (roleCounts.miner < totalVacancies - 1 && SQM.isQueueAvailable(room)) this.enqueueCreep(room, "miner");
    },

    processSpawnQueue(spawn: StructureSpawn) {
        const room = spawn.room;

        if (SQM.getQueueLength(room) > 0 && !spawn.spawning) {
            const nextCreep = SQM.peekQueue(room);

            if (nextCreep) {
                const energyCapacityAvailable = room.energyCapacityAvailable;
                const creepCost = this.getEnergyCost(nextCreep.parts);

                if (energyCapacityAvailable >= creepCost) {
                    const newName = `${nextCreep.role}_${Game.time}`;
                    let result;
                    // All slaves by-default are Upgraders
                    if (nextCreep.role === config.roles.slave.role){
                    result = spawn.spawnCreep(nextCreep.parts, newName, {
                        memory: { id: newName, role: nextCreep.role, subRole: "upgrader", target: undefined, roomAssignment: room.name},
                    });
                } else {
                    result = spawn.spawnCreep(nextCreep.parts, newName, {
                        memory: { id: newName, role: nextCreep.role, target: undefined, roomAssignment: room.name},
                    });
               }
                    if (result === OK) {
                        console.log(`[Spawn] Spawning new ${nextCreep.role}: ${newName}`);
                        SQM.removeFirstFromQueue(room); // Remove the creep from the queue
                    } else {
                        console.log(`[Spawn] Failed to spawn ${nextCreep.role}: ${result}`);
                    }
                }
            }
        }
    },

    countCreepsByRole(creeps: { [name: string]: Creep }): Record<string, number> {
        const roleKeys = Object.keys(config.roles);
        const counts: Record<string, number> = {};

        roleKeys.forEach(role => {
            counts[role] = _.filter(creeps, creep => creep.memory.role === role).length;
        });

        return counts;
    },

    enqueueCreep(room: Room, role: keyof typeof config.roles): void {
        const roleConfig = config.roles[role];

        if (!roleConfig) {
            console.error(`[Enqueue] Invalid role: ${role}`);
            return;
        }

        SQM.addToQueue(room, roleConfig.role, roleConfig.parts);
        console.log(`[Enqueue] Added ${roleConfig.role} to the queue in room ${room.name}`);
    },

    getEnergyCost(bodyParts: BodyPartConstant[]): number {
        const bodyPartCosts: { [part in BodyPartConstant]: number } = {
            move: 50,
            work: 100,
            carry: 50,
            attack: 80,
            ranged_attack: 150,
            heal: 250,
            claim: 600,
            tough: 10,
        };
        return bodyParts.reduce((cost, part) => cost + bodyPartCosts[part], 0);
    },
};
