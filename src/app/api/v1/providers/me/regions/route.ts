import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/v1/providers/me/regions - Get current provider's regions
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

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

    // Get provider's regions
    const { data: regions, error: regionsError } = await supabase
      .from('provider_regions')
      .select('region_id')
      .eq('provider_id', user.id);

    if (regionsError) {
      console.error('Get regions error:', regionsError);
      return NextResponse.json(
        { error: 'Грешка при получаване на региони' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        regionIds: regions?.map((r) => r.region_id) || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get regions error:', error);

    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/providers/me/regions - Update provider's regions
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { regionIds } = body;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

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
    if (!regionIds || !Array.isArray(regionIds) || regionIds.length === 0) {
      return NextResponse.json(
        { error: 'Моля, изберете поне един регион' },
        { status: 400 }
      );
    }

    // Delete existing regions
    const { error: deleteError } = await supabase
      .from('provider_regions')
      .delete()
      .eq('provider_id', user.id);

    if (deleteError) {
      console.error('Delete regions error:', deleteError);
      return NextResponse.json(
        { error: 'Грешка при обновяване на региони' },
        { status: 500 }
      );
    }

    // Insert new regions
    const providerRegions = regionIds.map((regionId: number) => ({
      provider_id: user.id,
      region_id: regionId,
    }));

    const { error: insertError } = await supabase
      .from('provider_regions')
      .insert(providerRegions);

    if (insertError) {
      console.error('Insert regions error:', insertError);
      return NextResponse.json(
        { error: 'Грешка при запазване на региони' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Регионите са обновени успешно',
        regionIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update regions error:', error);

    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
