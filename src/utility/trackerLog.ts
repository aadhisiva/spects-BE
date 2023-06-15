import { AppDataSource } from "../dbConfig/mysql"
import { tracker_data } from "../entity"

export const trackerCreateLogs = async (type, hitTime) => {
    let data = {};
    data['resposne_time'] = hittingTime();
    data['hitting_time'] = hitTime
    data['type'] = type;
    console.log("Data", hittingTime())
    return await AppDataSource.getRepository(tracker_data).save(data);
};

export const hittingTime = () => {
    const d = new Date();
    let dtOffset = new Date(d.setMinutes(d.getMinutes() - d.getTimezoneOffset()));
    return dtOffset.toISOString();
}