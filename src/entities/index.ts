
/**
 * Name: Aadhi siva panjagala
 * Author: aadhisivapanjagala@gmail.com
 * File: entities for db
 * created: [2023-05-10]
 * last Modified: [2023-08-07]
 * Project: Spectacles Distribution
 */

import {
    students_data,
    school_data,
    ekyc_data,
    other_benf_data,
    external_logs,
    master_data,
    district_data,
    taluka_data,
    rc_data,
    sub_centre_data,
    redirection_data,
    Session,
    state_data,
    phco_data
} from "../entity";

export const entities = () => {
    return [
        students_data,
        school_data,
        ekyc_data,
        other_benf_data,
        external_logs, master_data,
        district_data,
        taluka_data,
        rc_data,
        sub_centre_data,
        redirection_data,
        Session,
        state_data,
        phco_data
    ]
}
