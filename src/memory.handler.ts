export class RoomMemoryManager {

    // initialize room memory
    static initializeRoomMemory(room: Room): void {
        Memory.rooms ??= {};
        Memory.rooms[room.name] ??= {
            structures: {},
            creeps: {},
            flags: {},
            lastAnalyzed: 0,
            spawnQueue: [],
        };

    console.log(`Initialized memory for room: ${room.name}`);

    const roomMemory = Memory.rooms[room.name];

    // add all creeps that are assigned to this room
    Object.values(Game.creeps).forEach(creep => {
        const assignedRoom = creep.memory.roomAssignment;
        if (assignedRoom){
        Memory.rooms[assignedRoom].creeps[creep.name] = {
            id: creep.name,
            role: creep.memory.role,
            target: creep.memory.target,
            roomAssignment: assignedRoom,
        }
        }
    })

    // add all structures
    room.find(FIND_STRUCTURES).forEach(structure => {
        roomMemory.structures[structure.id] ??= {
            id: structure.id,
            type: structure.structureType,
            creeps: [],
        };
    });

    // add all flags
    room.find(FIND_FLAGS).forEach(flag => {
        roomMemory.flags[flag.name] ??= {
            id: flag.name,
            assignedPositions: [],
        }
    });

    // do calculations + analysis


    // write down when it is done
    // redo if needed
    }

    static addCreepToRoom(room: Room, creep: Creep): void {
        const roomMemory = Memory.rooms[room.name];

        if (!room.name){
            console.log(`There is no room could be assigned`)
        } else {
        roomMemory.creeps[creep.name] = {
            id: creep.name,
            role: creep.memory.role,
            target: creep.memory.target,
            roomAssignment: room.name,
        };
        }

        // Assign the creep to a target if specified and not already assigned
        if (creep.memory.target) {
            const roomMemory = Memory.rooms[room.name];

            // Check if the creep is already assigned to the target
            const isAlreadyAssigned = Object.values(roomMemory.structures).some(structure =>
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

        // Remove the creep from all structures
        Object.values(roomMemory.structures).forEach(structureMemory => {
            structureMemory.creeps = structureMemory.creeps.filter(name => name !== creepName);
        });
    }

    static assignCreepToTarget(room: Room, creepName: string, targetId: Id<Source | Structure>): void {
        const roomMemory = Memory.rooms[room.name];

        // Determine target type and assign creep
        if (roomMemory.structures[targetId]) {
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

    static analyzeRoom(room: Room): void {

        const roomMemory = Memory.rooms[room.name];

        // Analyze sources
        const sources = room.find(FIND_SOURCES);

        sources.forEach(source => {
            const sourceMemory = roomMemory.structures[source.id] ?? {
                id: source.id,
                type: "source",
                vacancies: 0,
                containers: [],
                creeps: [],
        };

        // Analyze structures
        const structures = room.find(FIND_STRUCTURES);
        structures.forEach(structure => {
            const structureMemory = roomMemory.structures[structure.id] ?? {
                id: structure.id,
                type: structure.structureType,
                creeps: [],
            };

        // Update memory for the structure
        roomMemory.structures[structure.id] = structureMemory;
        })

        // Calculate free spots around the source
        const freeSpots = room
            .lookAtArea(source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true)
            .filter(spot => spot.type === "terrain" && spot.terrain !== "wall")
            .map(spot => ({ x: spot.x, y: spot.y }));

        const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: structure => structure.structureType === STRUCTURE_CONTAINER,
        });

        sourceMemory.vacancies = freeSpots.length - containers.length;
        sourceMemory.containers = containers.map(container => container.id);

        // Update memory for the source
        roomMemory.structures[source.id] = sourceMemory;
        });

        room.find(FIND_FLAGS).forEach(flag => {
            if (!flag.memory.assignedPositions) {
                const centerX = flag.pos.x;
                const centerY = flag.pos.y;
                const positions: { x: number; y: number }[] = [];

                for (let dx = -2; dx <= 2; dx++) {
                    for (let dy = -2; dy <= 2; dy++) {
                        // Only include chess-pattern positions
                        if ((dx + dy) % 2 === 0) {
                            const x = centerX + dx;
                            const y = centerY + dy;

                            // Ensure the position is walkable
                            const terrain = Game.map.getRoomTerrain(flag.room!.name);
                            if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
                                positions.push({ x, y });
                            }
                        }
                    }
                }

                // Save positions to flag memory
                flag.memory.assignedPositions = positions;
                console.log(`Assigned positions for flag ${flag.name}:`, positions);
            }
        });

        // Update memory for the room
        Memory.rooms[room.name] = roomMemory;

        const now = Game.time;
        // Update the lastAnalyzed timestamp
        roomMemory.lastAnalyzed = now;

        console.log(`Room ${room.name} analysis complete.`);
        }
}
