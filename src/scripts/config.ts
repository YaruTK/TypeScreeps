// Global configuration for your Screeps codebase
export const config = {
    roles: {
        miner: {
            role: "miner",
            parts: [WORK, WORK, MOVE],
            defaultCount: 1, // Default number of miners
        },
        hauler: {
            role: "hauler",
            parts: [CARRY, MOVE],
            defaultCount: 2, // Default number of haulers
        },
        slave: {
            role: "slave",
            parts: [WORK, CARRY, MOVE],
            defaultCount: 1, // Default number of slaves
            defaultUpgraderCount: 2,
        },
        dummy: {
            role: "dummy",
            parts: [WORK, CARRY, MOVE],
            defaultCount: 2,
        },
    },
    priorities: {
        structures: {
            spawn: 1,
            extension: 2,
            tower: 3,
            controller: 4,
            container: 5,
            storage: 6,
        },
    },
    general: {
        maxQueueLength: 2, // Maximum spawn queue length
        repairThreshold: 0.5, // Structures below this percentage will be repaired
    },
    colors: {
        paths: {
            pickingUp: "#ffaa00",
            delivering: "#ffffff",
            upgrading: "#00ff00",
            repairing: "#aa00aa",
        },
    },
};

export default config;
