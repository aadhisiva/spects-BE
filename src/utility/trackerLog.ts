import { AppDataSource } from "../dbConfig/mysql"
import { external_logs } from "../entity/external_logs";

export const trackExternalLogs = async (table, method, type, body, response, user) => {
    let data = new external_logs({});
    data.body = JSON.stringify(body);
    data.hitting_time = hittingTime();
    data.response = JSON.stringify(response);
    data.method = method;
    data.table = table;
    data.type = type;
    data.user = user;
    return await AppDataSource.getRepository(external_logs).save(data);
};

export const hittingTime = () => {
    const d = new Date();
    let dtOffset = new Date(d.setMinutes(d.getMinutes() - d.getTimezoneOffset()));
    return dtOffset.toISOString();
}