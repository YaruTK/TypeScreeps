export class SpawnQueueManager {
    /**
     * Add a new creep to the spawn queue.
     * @param {Room} room - The room whose spawn queue is being updated.
     * @param {string} role - The role of the creep to add.
     * @param {BodyPartConstant[]} parts - The body parts for the creep.
     */
    static addToQueue(room: Room, role: string, parts: BodyPartConstant[]): void {
        const memRoom = Memory.rooms[room.name];
        if (!memRoom.spawnQueue) {
            memRoom.spawnQueue = [];
        }

        const queueEntry = { role, parts };
        memRoom.spawnQueue.push(queueEntry);
        console.log(`[SpawnQueue] Added to queue: ${JSON.stringify(queueEntry)} in room ${room.name}`);
        console.log(`[SpawnQueue] Current queue: ${JSON.stringify(memRoom.spawnQueue)}`);
    }

    /**
     * Remove the first entry from the spawn queue.
     * @param {Room} room - The room whose spawn queue is being updated.
     * @returns {void}
     */
    static removeFirstFromQueue(room: Room): void {
        const memRoom = Memory.rooms[room.name];
        if (!memRoom.spawnQueue || memRoom.spawnQueue.length === 0) {
            console.log(`[SpawnQueue] Queue is empty for room ${room.name}.`);
            return;
        }

        const removedEntry = memRoom.spawnQueue.shift();
        console.log(`[SpawnQueue] Removed from queue: ${JSON.stringify(removedEntry)} in room ${room.name}`);
        console.log(`[SpawnQueue] Current queue: ${JSON.stringify(memRoom.spawnQueue)}`);
    }

    /**
     * Clear the entire spawn queue for the room.
     * @param {Room} room - The room whose spawn queue is being cleared.
     */
    static clearQueue(room: Room): void {
        const memRoom = Memory.rooms[room.name];
        memRoom.spawnQueue = [];
        console.log(`[SpawnQueue] Cleared queue for room ${room.name}.`);
    }

    /**
     * Get the length of the spawn queue.
     * @param {Room} room - The room whose spawn queue length is being queried.
     * @returns {number} - The number of entries in the spawn queue.
     */
    static getQueueLength(room: Room): number {
        const memRoom = Memory.rooms[room.name];
        return memRoom.spawnQueue ? memRoom.spawnQueue.length : 0;
    }

    /**
     * Peek at the first entry in the spawn queue without removing it.
     * @param {Room} room - The room whose spawn queue is being queried.
     * @returns {object | undefined} - The first queue entry, or undefined if the queue is empty.
     */
    static peekQueue(room: Room): { role: string; parts: BodyPartConstant[] } | undefined {
        const memRoom = Memory.rooms[room.name];
        return memRoom.spawnQueue && memRoom.spawnQueue.length > 0
            ? memRoom.spawnQueue[0]
            : undefined;
    }
}
