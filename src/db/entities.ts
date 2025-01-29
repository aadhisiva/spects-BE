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
import { RcData } from "../entities/rcData";
import { RolesAccess } from "../entities/roleAccess";
import { Roles } from "../entities/roles";
import { SchoolData } from "../entities/schoolData";
import { SecondaryScreening } from "../entities/secondaryScreening";
import { StudentData } from "../entities/studentData";
import { UserData } from "../entities/userData";
import { Versions } from "../entities/versions";
import { webLogs } from "../entities/webLogs";


export const allEntities = [
    Versions,
    MasterData,
    webLogs,
    OtpLogs,
    UserData,
    RolesAccess,
    Roles,
    ChildRoles,
    MobileLogs,
    StudentData,
    SchoolData,
    OtherBenfData,
    AssignedMasters,
    NewDistricts,
    DemoAuthResponse,
    OtherBenfDataDummy,
    EkycData,
    SecondaryScreening,
    RcData
]