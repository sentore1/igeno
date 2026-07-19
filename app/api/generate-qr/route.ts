import { NextRequest, NextResponse } from 'next/server';
import { generateMoMoQRCode, generateProviderSpecificQR } from '@/lib/qrcode-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, amount, currency, reference, merchantName, provider } = body;

    // Validate required fields
    if (!phoneNumber || !amount) {
      return NextResponse.json(
        { error: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Generate QR code
    let qrCodeDataURL: string;

    if (provider && ['mtn', 'airtel', 'orange'].includes(provider.toLowerCase())) {
      // Generate provider-specific QR code
      qrCodeDataURL = await generateProviderSpecificQR(
        provider.toLowerCase() as 'mtn' | 'airtel' | 'orange',
        { phoneNumber, amount, currency, reference, merchantName }
      );
    } else {
      // Generate generic QR code
      qrCodeDataURL = await generateMoMoQRCode({
        phoneNumber,
        amount,
        currency: currency || 'RWF',
        reference: reference || '',
        merchantName: merchantName || '',
      });
    }

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataURL,
      paymentData: {
        phoneNumber,
        amount,
        currency: currency || 'RWF',
        reference,
        merchantName,
      },
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
