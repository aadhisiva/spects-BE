import {
    login_user_data,
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
    state_data
} from "../entity";

export const entities = () => {
    return [
        login_user_data,
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
        state_data
    ]
}
