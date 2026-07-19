/**
 * QR Code Generator for Mobile Money Payments
 * Generates QR codes with tel: URI for Rwanda MTN Mobile Money USSD codes
 * When scanned, the QR code automatically opens the phone dialer with the USSD code
 * 
 * Format: tel:*182*8*1*RECIPIENT*AMOUNT#
 * - RECIPIENT can be phone number (250788123456) or MoMo code (123456)
 * - AMOUNT is rounded to integer (no decimals)
 * - %23 is URL encoding for # symbol
 * 
 * Examples:
 * - Phone: tel:*182*8*1*250788123456*1000%23 → *182*8*1*250788123456*1000#
 * - Code:  tel:*182*8*1*123456*1000%23 → *182*8*1*123456*1000#
 */

import QRCode from 'qrcode';

export interface MoMoPaymentData {
  phoneNumber: string;
  amount: number;
  currency?: string;
  reference?: string;
  merchantName?: string;
}

/**
 * Generate a QR code for Mobile Money payment
 * Returns base64 image data URL
 */
export async function generateMoMoQRCode(
  paymentData: MoMoPaymentData
): Promise<string> {
  try {
    // Format: MOMO:phone:amount:currency:reference:merchant
    // This format is compatible with most mobile money apps in Africa
    const qrData = formatMoMoQRData(paymentData);

    // Generate QR code as data URL (base64)
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // High error correction for better scanning
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Format Mobile Money QR data
 * Uses tel: URI format for Rwanda MTN Mobile Money USSD codes
 * When scanned, automatically dials the payment code
 * 
 * @param data - Payment data with phoneNumber or momoCode
 * phoneNumber can be actual phone OR MoMo code - it's just the recipient identifier
 */
function formatMoMoQRData(data: MoMoPaymentData): string {
  const {
    phoneNumber, // This could be phone number OR MoMo code
    amount,
  } = data;

  // Clean recipient (remove spaces, dashes, etc.)
  const cleanRecipient = phoneNumber.replace(/[\s\-\(\)\+]/g, '');

  // Round amount to integer (USSD doesn't support decimals)
  const roundedAmount = Math.round(amount);

  // Format: tel:*182*8*1*RECIPIENT*AMOUNT#
  // RECIPIENT can be:
  // - Phone: tel:*182*8*1*250788123456*1000# 
  // - Code:  tel:*182*8*1*123456*1000#
  // When scanned, this automatically opens the phone dialer with the USSD code
  return `tel:*182*8*1*${cleanRecipient}*${roundedAmount}%23`;
}

/**
 * Generate QR code as Canvas (for client-side rendering)
 */
export async function generateMoMoQRCanvas(
  paymentData: MoMoPaymentData,
  canvas: HTMLCanvasElement
): Promise<void> {
  try {
    const qrData = formatMoMoQRData(paymentData);
    
    await QRCode.toCanvas(canvas, qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (error) {
    console.error('Error generating QR code on canvas:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code for MoMo code (instead of phone number)
 * @param momoCode - The 6-digit MoMo code
 * @param amount - Payment amount
 */
export async function generateMoMoCodeQR(
  momoCode: string,
  amount: number
): Promise<string> {
  const roundedAmount = Math.round(amount);
  // Format: tel:*182*8*1*MOMO_CODE*AMOUNT#
  const qrData = `tel:*182*8*1*${momoCode}*${roundedAmount}%23`;

  const qrCodeDataURL = await QRCode.toDataURL(qrData, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });

  return qrCodeDataURL;
}

/**
 * Alternative format for specific providers (if needed)
 */
export async function generateProviderSpecificQR(
  provider: 'mtn' | 'airtel' | 'orange',
  paymentData: MoMoPaymentData
): Promise<string> {
  let qrData: string;
  const cleanPhone = paymentData.phoneNumber.replace(/[\s\-\(\)\+]/g, '');
  const roundedAmount = Math.round(paymentData.amount);

  switch (provider.toLowerCase()) {
    case 'mtn':
      // MTN Mobile Money USSD format
      qrData = `tel:*182*8*1*${cleanPhone}*${roundedAmount}%23`;
      break;
    
    case 'airtel':
      // Airtel Money USSD format (if different)
      qrData = `tel:*182*8*1*${cleanPhone}*${roundedAmount}%23`;
      break;
    
    case 'orange':
      // Orange Money USSD format (if different)
      qrData = `tel:*182*8*1*${cleanPhone}*${roundedAmount}%23`;
      break;
    
    default:
      // Fall back to generic format
      qrData = formatMoMoQRData(paymentData);
  }

  const qrCodeDataURL = await QRCode.toDataURL(qrData, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });

  return qrCodeDataURL;
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (typically 10-15 digits for international)
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Format as: +250 XXX XXX XXX
  if (digitsOnly.startsWith('250')) {
    return `+250 ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6, 9)} ${digitsOnly.slice(9)}`;
  }
  
  return phone;
}
