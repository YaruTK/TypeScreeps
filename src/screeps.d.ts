declare global {
    interface CreepMemory {
        id: string;
        role: string;
        subRole?: string;
        target?: Id<Source | Structure>;
        mining?: boolean;
        pickingUp?: boolean;
        working?: boolean;
    }

    interface SourceMemory {
        id: Id<Source>;
        vacancies: number;
        creeps: string[];
    }

    interface StructureMemory {
        id: Id<Structure>;
        type: string;
        creeps: string[];
    }

    interface RoomMemory {
        sources: { [id: string]: SourceMemory };
        structures: { [id: string]: StructureMemory };
        creeps: { [id: string]: CreepMemory };
        lastAnalyzed?: number; // Timestamp of the last analysis
        initialized: boolean;
        spawnQueue: any[];
    }
}

export {};
