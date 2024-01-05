import { Service } from "typedi";
import { SMSServices } from "./sms_otp";


@Service()
export class ResusableFunctions {

    constructor(public ResusableFunctions: SMSServices) { };

    async sendOtpAsSingleSms(mobile_no, otp) {
        let text = `Your OTP is ${otp}.Directorate of EDCS.`;
        let sendSingleSms = await this.ResusableFunctions.sendSingleSMS(
            process.env.SMS_USERNAME,
            process.env.SMS_PASSWORD,
            process.env.SMS_SENDER_ID,
            text,
            mobile_no,
            process.env.SMS_API_SERVICE_KEY,
            process.env.TEMPLATE_ID
        );
        return sendSingleSms;
    };

    async sendSmsInKannadaUnicode(mobile_no, otp) {
        let text = `ಅಪ್ಲಿಕೇಶನ್ ಲಾಗಿನ್ ಒಟಿಪಿ ${otp}.
        -NHM, Gok`;
        let sendSingleSms = await this.ResusableFunctions.sendSingleUnicode(
            process.env.SMS_USERNAME,
            process.env.SMS_PASSWORD,
            process.env.SMS_SENDER_ID,  
            text,
            mobile_no,
            process.env.SMS_API_SERVICE_KEY,
            process.env.TEMPLATE_ID_KANNADA
        );
        return sendSingleSms;
    }

    // async sendSmsInKannadaUnicode(mobile_no, otp) {
    //     let text = `Dear Employee,
    //     As you are covered under National Pension Scheme, you are informed to contact your DDO to get the PRAN number immediately.
    //     ಆತ್ಮೀಯ ಉದ್ಯೋಗಿ,
    //     ತಾವು ರಾಷ್ಟ್ರೀಯ ಪಿಂಚಣಿ  ಯೋಜನೆಗೆ ಒಳಪಡುವುದರಿಂದ, ತಮ್ಮ ಪ್ರಾನ್‌ ಸಂಖ್ಯೆಯನ್ನು  ಪಡೆಯಲು ತಮ್ಮ ಡಿಡಿಓರವರನ್ನು ಸಂಪರ್ಕಿಸಲು ತಿಳಿಸಿದೆ.
    //     --Department of Treasuries, Government of Karnataka.`;
    //     let sendSingleSms = await this.ResusableFunctions.sendSingleUnicode(
    //         "Mobile_1-KIIGOK",
    //         "kiigok@1234",
    //         'KIIGOK',  
    //         text,
    //         mobile_no,
    //         'e8f4e2f0-d005-4ecb-bbdc-0a4cbac18088',
    //         '1107170167482102813'
    //     );
    //     return sendSingleSms;
    // }

    async sendOtpAsReadyForDeliver(mobile_no, otp, order_number) {
        let text = `${otp} is the OTP for Spectacle Delivery for the order number ${order_number}
        -National Health mission ,GOK.`;
        console.log("text",text)
        let sendSingleSms = await this.ResusableFunctions.sendSingleSMS(
            process.env.SMS_USERNAME,
            process.env.SMS_PASSWORD,
            process.env.SMS_SENDER_ID,
            text,
            mobile_no,
            process.env.SMS_API_SERVICE_KEY,
            process.env.TEMPLATE_ID_FOR_DELIVER
        );
        return sendSingleSms;
    };
}