import nodemailer from "nodemailer";
import { AppDataSource } from "./mysql";
import { redirection_data } from "../entity";

// async..await is not allowed in global scope, must use a wrapper
export async function emailSender(data) {
  // create reusable transporter object using the default SMTP transport
 let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "aadhisivapanjagala@gmail.com", // generated ethereal user
    pass: "cmnwtwiwkpwiborw", // generated ethereal password
  },
});
  let redirection_url = await AppDataSource.getRepository(redirection_data).find();
  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Spectacles" <noreply@spectacles.com>', // sender address
    to: `${data[0].school_mail}`, // list of receivers
    subject: "Spectacles Information", // Subject line
    // text: "Hello world?", // plain text body
    html: `
    <html>
    <head>
      <title></title>
      <link href="https://svc.webspellchecker.net/spellcheck31/lf/scayt3/ckscayt/css/wsc.css" rel="stylesheet" type="text/css" />
    </head>
    <body>
    <div>To,</div>
    <div>[School Administration/Principle],</div>
    <div>${data[0].school_mail},</div>
    <div>${data[0].village}(v)</div>
    <div>${data[0].district}(D)</div>
    
    <div>&nbsp;</div>
    
    <div>Subject: Distribution of Spectacles to Students</div>
    
    <div>&nbsp;</div>
    
    <div>Respected Sir/Madam,</div>
    
    <div>&nbsp;</div>
    
    <div>I am writing to inform you that the government-sponsored spectacle distribution program, in collaboration with [Maker&#39;s Name], has been successfully carried out in [City/Town/Village]. We are pleased to share the list of students who have received spectacles through this initiative at your school.</div>
    
    <div>&nbsp;</div>
    
    <div>Please find below the comprehensive list of students along with their respective details:</div>
    
    <div>&nbsp;</div>

    <a href="${redirection_url[0].mail_url}/school/check?s_id=${data.school_id}&id=${data.user_id}&type=${data.type}">check for ready for delivery</a>
    
    <div>&nbsp;</div>
    
    <div>Please note that this list is inclusive of all eligible students who were identified and prioritized based on their visual impairment needs. In case there are any discrepancies or if any student has been inadvertently excluded from the list, kindly inform us as soon as possible so that we can rectify the situation promptly.</div>
    
    <div>&nbsp;</div>
    
    <div>As the government aims to enhance the academic performance and overall well-being of students, it recognizes the importance of adequate vision for effective learning. We deeply appreciate your support and cooperation in implementing this program and contributing to the welfare of the students. If you have any further questions or require additional assistance, please do contact us at [Contact Information].</div>
    
    <div>&nbsp;</div>
    
    <div>Thank you for your attention and commitment to the well-being of our students.</div>
    
    <div>&nbsp;</div>
    
    <div>Best regards,</div>
    
    <div>&nbsp;</div>
    
    <div>[Your Name]</div>
    
    <div>[Maker Name]</div>
    
    <div>[Contact Information]</div>
    </body>
    </html>
        `, // html body
  });

  // console.log("Message sent: %s", info.messageId);
  return (info?.accepted.length == 0) ? 422 : true;
};