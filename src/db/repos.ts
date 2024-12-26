import { AssignedMasters } from "../entities/assignedMasters";
import { ChildRoles } from "../entities/childRoles";
import { DemoAuthResponse } from "../entities/demoAuthResponse";
import { EkycData } from "../entities/ekycData";
import { MasterData } from "../entities/masterData";
import { MobileLogs } from "../entities/mobileLogs";
import { NewDistricts } from "../entities/newDistricts";
import { OtherBenfData } from "../entities/otherBenfData";
import { OtherBenfDataDummy } from "../entities/otherBenfDataDum";
import { OtpLogs } from "../entities/otpLogs";
import { RolesAccess } from "../entities/roleAccess";
import { Roles } from "../entities/roles";
import { SchoolData } from "../entities/schoolData";
import { StudentData } from "../entities/studentData";
import { UserData } from "../entities/userData";
import { Versions } from "../entities/versions";
import { webLogs } from "../entities/webLogs";
import { AppDataSource } from "./config";


export const repository = {
    versionRepo: AppDataSource.getRepository(Versions),
    childRolesRepo: AppDataSource.getRepository(ChildRoles),
    masterDataRepo: AppDataSource.getRepository(MasterData),
    mobileLogsRepo: AppDataSource.getRepository(MobileLogs),
    otherBenfDataRepo: AppDataSource.getRepository(OtherBenfData),
    studentDataRepo: AppDataSource.getRepository(StudentData),
    schoolDataRepo: AppDataSource.getRepository(SchoolData),
    otpLogsRepo: AppDataSource.getRepository(OtpLogs),
    rolesRepo: AppDataSource.getRepository(Roles),
    rolesAccessRepo: AppDataSource.getRepository(RolesAccess),
    userDataRepo: AppDataSource.getRepository(UserData),
    webLogsRepo: AppDataSource.getRepository(webLogs),
    assignedMastersRepo: AppDataSource.getRepository(AssignedMasters),
    newDistrictsRepo: AppDataSource.getRepository(NewDistricts),
    demoAuthResponseRepo: AppDataSource.getRepository(DemoAuthResponse),
    otherBenfDataDummyRepo: AppDataSource.getRepository(OtherBenfDataDummy),
    ekycDataRepo: AppDataSource.getRepository(EkycData),
};

export const repoNames = {
    RolesTable: Roles,
    MasterDataTable: MasterData,
    UserDataTable: UserData,
    webLogsTable: webLogs,
    OtpLogsTable: OtpLogs,
    RolesAccessTable: RolesAccess,
    ChildRolesTable: ChildRoles,    
    VersionsTable: Versions,
    MobileLogTable: MobileLogs,
    StudentDataTable: StudentData,
    SchoolDataTable: SchoolData,
    OtherBenfDataTable: OtherBenfData,
    AssignedMastersTable: AssignedMasters,
    NewDistrictsTable: NewDistricts,
    DemoAuthResponseTable: DemoAuthResponse,
    EkycDataTable: EkycData,
}