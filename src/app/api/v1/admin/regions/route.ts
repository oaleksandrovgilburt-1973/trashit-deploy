import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/v1/admin/regions
 * 
 * Get all regions (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create authenticated client
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: adminProfile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нямате достъп до тази ресурс' },
        { status: 403 }
      );
    }

    // Get regions
    const { data: regions, error } = await authClient
      .from('regions')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Грешка при обработка' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      regions: regions || [],
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/regions
 * 
 * Create a new region (admin only)
 * 
 * Body:
 * {
 *   "name": "Sofia",
 *   "code": "SOF"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Име и код са задължителни' },
        { status: 400 }
      );
    }

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create authenticated client
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: adminProfile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нямате достъп до тази ресурс' },
        { status: 403 }
      );
    }

    // Create region
    const { data: region, error } = await authClient
      .from('regions')
      .insert({ name, code })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Грешка при създаване на регион' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, region },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
