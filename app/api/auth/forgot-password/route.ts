// app/api/auth/forgot-password/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, detail: 'Номер телефона обязателен' },
        { status: 400 }
      );
    }

    // Here you would normally:
    // 1. Check if user exists with this phone number
    // 2. Generate a reset token
    // 3. Send SMS with reset link or code
    // 4. Store the token in database

    console.log('🔑 Восстановление пароля для:', phone);

    // For testing - simulate sending SMS
    // In production, you would integrate with SMS service
    const resetToken = Math.random().toString(36).substring(2, 15);

    // TODO: Save reset token to database with expiration
    // TODO: Send SMS with reset link/code

    return NextResponse.json({
      success: true,
      message: 'Инструкции по восстановлению отправлены',
      // In production, don't send the token in response
      // Only for testing:
      debug_token: resetToken
    });

  } catch (error) {
    console.error('❌ Ошибка восстановления пароля:', error);
    return NextResponse.json(
      { 
        success: false, 
        detail: 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    );
  }
}