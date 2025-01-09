declare global {
    interface CreepMemory {
        [name: string]: any;
        role: string;
        building?: boolean;
        upgrading?: boolean;
    }
    interface Memory {
        creeps: {[name: string]: CreepMemory}
    }
}

export {};
