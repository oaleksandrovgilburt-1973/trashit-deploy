import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      phone,
      idDocumentUrl,
      regionIds,
    } = body;

    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    // Validate input
    if (!fullName || !phone || !regionIds || regionIds.length === 0) {
      return NextResponse.json(
        { error: 'Липсват задължителни полета' },
        { status: 400 }
      );
    }

    // Update profile with provider info
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        id_document_url: idDocumentUrl,
        provider_status: 'pending',
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Грешка при обновяване на профила' },
        { status: 500 }
      );
    }

    // Create provider_regions entries
    const providerRegions = regionIds.map((regionId: number) => ({
      provider_id: user.id,
      region_id: regionId,
    }));

    const { error: regionsError } = await supabase
      .from('provider_regions')
      .insert(providerRegions);

    if (regionsError) {
      console.error('Provider regions insert error:', regionsError);
      return NextResponse.json(
        { error: 'Грешка при запазване на региони' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Заявката е подадена успешно',
        providerId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Provider apply error:', error);

    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
