'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/email';
import { hash } from '../encrypt';
import { randomBytes, randomInt } from 'crypto';

const generateToken = () => randomBytes(32).toString('hex');

const getVerificationEmailLink = (token: string) =>
  `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}`;

const getPasswordResetLink = (token: string) =>
  `${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token}`;

export async function sendVerificationEmailToken(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't disclose whether the email is registered.
      return {
        success: true,
        message: 'If an account exists for that email, a verification link has been sent.',
      };
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    const verificationLink = getVerificationEmailLink(token);

    try {
      await sendVerificationEmail({
        email,
        verificationLink,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return {
        success: false,
        message: `Failed to send verification email: ${formatError(error)}`,
      };
    }

    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function verifyEmail(token: string) {
  try {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, message: 'Invalid or expired token' };
    }

    if (verificationToken.expires < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return { success: false, message: 'Token has expired' };
    }

    await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() },
    });

    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function requestPasswordReset(email: string) {
  // Always return the same message so this endpoint can't be used to discover
  // which emails are registered.
  const genericSuccess = {
    success: true,
    message: 'If an account exists for that email, a password reset link has been sent.',
  };

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return genericSuccess;
    }

    // Throttle: at most 3 reset requests per 15 minutes per email.
    const windowStart = new Date(Date.now() - 15 * 60 * 1000);
    const recentCount = await prisma.passwordResetToken.count({
      where: { email, createdAt: { gte: windowStart } },
    });
    if (recentCount >= 3) {
      return genericSuccess;
    }

    // Invalidate any outstanding reset tokens before issuing a new one.
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    const resetLink = getPasswordResetLink(token);

    try {
      await sendPasswordResetEmail({
        email,
        resetLink,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }

    return genericSuccess;
  } catch (error) {
    console.error('requestPasswordReset error:', error);
    return genericSuccess;
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!passwordResetToken) {
      return { success: false, message: 'Invalid or expired token' };
    }

    if (passwordResetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: passwordResetToken.id },
      });
      return { success: false, message: 'Token has expired' };
    }

    const hashedPassword = await hash(newPassword);

    await prisma.user.update({
      where: { email: passwordResetToken.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: passwordResetToken.id },
    });

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Cryptographically secure 6-digit OTP (avoids the predictability of Math.random).
const generateOtp = () => randomInt(0, 1_000_000).toString().padStart(6, '0');

export async function sendPhoneOtp(userId: string, phoneNumber: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Throttle OTP resends: at most 5 codes per 15 minutes per user.
    const windowStart = new Date(Date.now() - 15 * 60 * 1000);
    const recentCount = await prisma.phoneVerificationToken.count({
      where: { userId, createdAt: { gte: windowStart } },
    });
    if (recentCount >= 5) {
      return {
        success: false,
        message: 'Too many codes requested. Please wait a few minutes and try again.',
      };
    }

    const otp = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.phoneVerificationToken.create({
      data: {
        userId,
        phone: phoneNumber,
        otp,
        expires,
      },
    });

    try {
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        console.error('Twilio credentials not configured');
        return {
          success: false,
          message: 'SMS service not configured',
        };
      }

      const auth = Buffer.from(
        `${twilioAccountSid}:${twilioAuthToken}`
      ).toString('base64');

      const params = new URLSearchParams();
      params.append('From', twilioPhoneNumber);
      params.append('To', phoneNumber);
      params.append('Body', `Your verification code is: ${otp}. This code will expire in 10 minutes.`);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Twilio SMS error:', error);
        return {
          success: false,
          message: 'Failed to send verification code',
        };
      }
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
      return {
        success: false,
        message: 'Failed to send verification code via SMS',
      };
    }

    return {
      success: true,
      message: 'Verification code sent to your phone',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function verifyPhoneOtp(userId: string, otp: string) {
  try {
    // Look up the latest code for this user (NOT by otp value) so an incorrect
    // guess still counts against the attempt cap instead of silently missing.
    const verificationToken = await prisma.phoneVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationToken) {
      return { success: false, message: 'No verification code found. Please request a new one.' };
    }

    if (verificationToken.expires < new Date()) {
      await prisma.phoneVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return { success: false, message: 'Verification code has expired' };
    }

    if (verificationToken.attempts >= 5) {
      await prisma.phoneVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new code.',
      };
    }

    if (verificationToken.otp !== otp) {
      await prisma.phoneVerificationToken.update({
        where: { id: verificationToken.id },
        data: { attempts: { increment: 1 } },
      });
      return { success: false, message: 'Invalid verification code' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber: verificationToken.phone,
        phoneVerified: new Date(),
      },
    });

    await prisma.phoneVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { success: true, message: 'Phone number verified successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function incrementPhoneOtpAttempts(userId: string, otp: string) {
  try {
    const verificationToken = await prisma.phoneVerificationToken.findFirst({
      where: { userId, otp },
    });

    if (verificationToken) {
      await prisma.phoneVerificationToken.update({
        where: { id: verificationToken.id },
        data: { attempts: { increment: 1 } },
      });
    }
  } catch (error) {
    console.error('Failed to increment OTP attempts:', error);
  }
}
