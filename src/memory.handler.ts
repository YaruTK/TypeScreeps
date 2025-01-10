export class RoomMemoryManager {
    static initializeRoomMemory(room: Room): void {
        Memory.rooms ??= {};
        Memory.rooms[room.name] ??= {
            sources: {},
            structures: {},
            creeps: {},
            lastAnalyzed: 0,
            initialized: false,
            spawnQueue: [],
        };

        console.log(`Initialized memory for room: ${room.name}`);
        const roomMemory = Memory.rooms[room.name];

        // Initialize sources
        room.find(FIND_SOURCES).forEach(source => {
            roomMemory.sources[source.id] ??= {
                id: source.id,
                vacancies: 1,
                creeps: [],
            };
            console.log(`Source initialized: ${source.id}`);
        });

        // Initialize structures
        room.find(FIND_STRUCTURES).forEach(structure => {
            roomMemory.structures[structure.id] ??= {
                id: structure.id,
                type: structure.structureType,
                creeps: [],
            };
        });
        // Set it initialized
        Memory.rooms[room.name].initialized = true;
    }

    static addCreepToRoom(room: Room, creep: Creep): void {
        const roomMemory = Memory.rooms[room.name];
        roomMemory.creeps[creep.name] = {
            id: creep.name,
            role: creep.memory.role,
            target: creep.memory.target,
        };
        // Assign the creep to a target if specified and not already assigned
        if (creep.memory.target) {
            const roomMemory = Memory.rooms[room.name];

            // Check if the creep is already assigned to the target
            const isAlreadyAssigned = Object.values(roomMemory.sources).some(source =>
                source.creeps.includes(creep.name)
            ) || Object.values(roomMemory.structures).some(structure =>
                structure.creeps.includes(creep.name)
            );

            if (!isAlreadyAssigned) {
                this.assignCreepToTarget(room, creep.name, creep.memory.target);
            } else {
                console.log(`[${creep.name}] Already assigned to target: ${creep.memory.target}`);
            }
        }
    }

    static removeCreepFromRoom(room: Room, creepName: string): void {
        const roomMemory = Memory.rooms[room.name];

        // Remove the creep from the creeps list
        delete roomMemory.creeps[creepName];

        // Remove the creep from all sources
        Object.values(roomMemory.sources).forEach(sourceMemory => {
            sourceMemory.creeps = sourceMemory.creeps.filter(name => name !== creepName);
        });

        // Remove the creep from all structures
        Object.values(roomMemory.structures).forEach(structureMemory => {
            structureMemory.creeps = structureMemory.creeps.filter(name => name !== creepName);
        });
    }

    static assignCreepToTarget(room: Room, creepName: string, targetId: Id<Source | Structure>): void {
        const roomMemory = Memory.rooms[room.name];

        // Determine target type and assign creep
        if (roomMemory.sources[targetId]) {
            roomMemory.sources[targetId].creeps.push(creepName);
        } else if (roomMemory.structures[targetId]) {
            roomMemory.structures[targetId].creeps.push(creepName);
        }
    }

    static cleanupExpiredCreeps(room: Room): void {
        const roomMemory = Memory.rooms[room.name];

        for (const creepName in roomMemory.creeps) {
            if (!Game.creeps[creepName]) {
                console.log(`Cleaning up expired creep: ${creepName}`);
                this.removeCreepFromRoom(room, creepName);
            }
        }

        // Cleanup expired workers from creeps too
        for(const name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
    }
}
