// import nodemailer from 'nodemailer';
// import config from '../config';



// export const sendEmail = async (to: string, subject: string, html: string) => {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: config.NODE_ENV === 'production',
//     auth: {
//       // TODO: replace `user` and `pass` values from <https://forwardemail.net>
//       user: config.nodemailer_host_email,
//       pass: config.nodemailer_host_pass,
//     },
//   });

//   await transporter.sendMail({
//     // from: 'nurmdopu428@gmail.com', // sender address
//     from: 'information@woofspot.net', // sender address
//     to, // list of receivers
//     subject,
//     text: '', // plain text body
//     html, // html body
//   });
// };

import axios from "axios";
import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: config.NODE_ENV === 'production',
    auth: {
      user: config.nodemailer_host_email,
      pass: config.nodemailer_host_pass,
    },
    debug: true, // Enable debug output to show detailed SMTP communication logs
    logger: true, // Enable logger to log SMTP communication
  });

  await transporter.sendMail({
    from: 'information@woofspot.net', // sender address
    to, // list of receivers
    subject,
    text: '', // plain text body
    html, // html body
  });
};


export const sendEmailViaAPI = async (to: string, subject: string, html: string, text: string = "") => {
  try {

    console.log("📧 Sending email via API to:", {to,subject,html,text});
    const response = await axios.post("https://nodemailer-sara.vercel.app/sent_email", {
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.log({error});
    console.error("❌ Failed to send email:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Email sending failed");
  }
};

