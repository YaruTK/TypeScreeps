import { RoomMemoryManager } from "../memory.handler";

const analyzeRoom = {
    analyze(room: Room): void {
        const roomMemory = Memory.rooms[room.name];

        // Check if analysis is needed
        const now = Game.time;
        if (roomMemory.lastAnalyzed && now - roomMemory.lastAnalyzed < 60) {
            console.log(`Room ${room.name} analysis skipped (recently analyzed). Next analysis in ${60 - now + roomMemory.lastAnalyzed} s.`);
            return;
        }

        console.log(`Analyzing room: ${room.name}`);

        // Ensure room memory is initialized
        if (!Memory.rooms[room.name].initialized){
            RoomMemoryManager.initializeRoomMemory(room);
        }

        // Analyze sources
        const sources = room.find(FIND_SOURCES);
        sources.forEach(source => {
            const sourceMemory = roomMemory.sources[source.id] ?? {
                id: source.id,
                vacancies: 0,
                creeps: [],
            };

            // Calculate free spots around the source
            const freeSpots = room
                .lookAtArea(source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true)
                .filter(spot => spot.type === "terrain" && spot.terrain !== "wall")
                .map(spot => ({ x: spot.x, y: spot.y }));

            sourceMemory.vacancies = freeSpots.length;

            // Update memory for the source
            roomMemory.sources[source.id] = sourceMemory;
        });

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
        });

        // Update the lastAnalyzed timestamp
        roomMemory.lastAnalyzed = now;

        console.log(`Room ${room.name} analysis complete.`);
    },
};

export default analyzeRoom;
