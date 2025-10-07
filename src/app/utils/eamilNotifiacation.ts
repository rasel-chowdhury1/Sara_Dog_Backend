import { sendEmail, sendEmailViaAPI } from './mailSender';
interface OtpSendEmailParams {
  sentTo: string;
  subject: string;
  name: string;
  otp: string | number;
  expiredAt: string;
}

const otpSendEmail = async ({
  sentTo,
  subject,
  name,
  otp,
  expiredAt,
}: OtpSendEmailParams): Promise<void> => {
  await sendEmailViaAPI(
    sentTo,
    subject,
    `
      <div style="background-color: #ffffff; color:#FAFAFA; font-family: Arial, sans-serif; max-width: 600px; margin: auto;       padding: 20px; border: 1px solid #F97316; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://api.woofspot.net/logo/sara.png" alt="Sara sns woof" style="max-width: 100%; height: auto;" />
        </div>

        <p style="font-size: 28px; font-weight: 600;  color: #F97316; text-align: center;" >Welcome to the Woof Spot pack!</p>

        <div style="background-color: #f2f2f2; padding: 20px; border-radius: 5px; margin-top: 12px;">
           <p style="color: #F97316; text-align: center; font-size: 20px; font-weight: 500;">Your OTP: <strong>${otp}</strong></p>
           <p style="font-size: 14px; color: #666; margin-top: 4px;">This OTP is valid until: ${expiredAt.toLocaleString()}</p>
        </div>
      </div>
    `,
  );
};

export { otpSendEmail };
