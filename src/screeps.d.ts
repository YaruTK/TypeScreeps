declare global {
    interface CreepMemory {
        id: string;
        role: string;
        subRole?: string;
        target?: Id<Source | Structure>;
        state?: string;
        roomAssignment?: string;
        container?: string;
        position?: {x: number, y: number},
    }

    interface FlagMemory {
        id: string;
        assignedPositions?:{ x: number; y: number }[];
    }

    interface StructureMemory {
        id: Id<Structure>;
        type: string;
        vacancies?: number;
        containers?: Id<StructureContainer>[];
        creeps: string[];
    }

    interface RoomMemory {
        structures: { [id: string]: StructureMemory };
        creeps: { [id: string]: CreepMemory };
        flags: { [id: string]: FlagMemory};
        lastAnalyzed?: number; // Timestamp of the last analysis
        spawnQueue: any[];
    }
}

export {};
