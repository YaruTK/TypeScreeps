import _ from "lodash";
import actions from "../scripts/actions"

let roleMiner: {
    /**
     * @param {Creep} creep
     */
    run(creep: Creep): void;
};

export default roleMiner = {
    run(creep: Creep) {
        // Ensure the creep has a target assigned
        actions.mineInContainer(creep);
        },
    }
