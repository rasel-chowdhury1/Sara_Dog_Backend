import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Port 587 for TLS
    secure: config.NODE_ENV === 'production', // Only true for SSL port 465
    auth: {
      user: config.nodemailer_host_email, // your email address
      pass: config.nodemailer_host_pass, // your Gmail password or app password if 2FA is enabled
    },
  });

  try {
    await transporter.sendMail({
      from: 'information@woofspot.net', // sender address
      to, // recipient
      subject, // email subject
      text: '', // optional plain text version of email content
      html, // email body in HTML
    });
    console.log('OTP email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

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
