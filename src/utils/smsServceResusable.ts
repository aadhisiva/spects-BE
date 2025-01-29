import { sendSingleSMS, sendSingleUnicode } from "./sms_otp";

export const sendOtpAsSingleSms = async (mobile_no: string, otp: string) => {
    let text = `Your OTP is ${otp}.Directorate of EDCS.`;
    let sendSingleSms = await sendSingleSMS(
        process.env.SMS_USERNAME!,
        process.env.SMS_PASSWORD!,
        process.env.SMS_SENDER_ID!,
        text,
        mobile_no,
        process.env.SMS_API_SERVICE_KEY!,
        process.env.TEMPLATE_ID!
    );
    return sendSingleSms;
};

export const sendSmsInKannadaUnicode = (mobile_no: string, otp: string) => {
    let text = `ಅಪ್ಲಿಕೇಶನ್ ಲಾಗಿನ್ ಒಟಿಪಿ ${otp}.
        -NHM, Gok`;
    let sendSingleSms = sendSingleUnicode(
        process.env.SMS_USERNAME!,
        process.env.SMS_PASSWORD!,
        process.env.SMS_SENDER_ID!,
        text,
        mobile_no,
        process.env.SMS_API_SERVICE_KEY!,
        process.env.TEMPLATE_ID_KANNADA!
    );
    return sendSingleSms;
}


export const sendOtpAsReadyForDeliver = async (mobile_no: string, otp: string, order_number: string) => {
    let text = `${otp} is the OTP for Spectacle Delivery for the order number ${order_number}
        -National Health mission ,GOK.`;
    let sendSingleSms = await sendSingleSMS(
        process.env.SMS_USERNAME!,
        process.env.SMS_PASSWORD!,
        process.env.SMS_SENDER_ID!,
        text,
        mobile_no,
        process.env.SMS_API_SERVICE_KEY!,
        process.env.TEMPLATE_ID_FOR_DELIVER!
    );
    return sendSingleSms;
};