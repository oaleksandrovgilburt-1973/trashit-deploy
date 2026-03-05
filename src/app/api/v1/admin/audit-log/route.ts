import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/v1/admin/audit-log
 * 
 * Get audit log entries (admin only)
 * 
 * Query Parameters:
 * - entity_type: 'request' | 'dispute' | 'user' | 'payment' | etc.
 * - entity_id: UUID of entity
 * - action: 'created' | 'updated' | 'deleted' | etc.
 * - actor_id: UUID of actor
 * - limit: 50 (default)
 * - offset: 0 (default)
 * - search: search in description
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const action = searchParams.get('action');
    const actorId = searchParams.get('actor_id');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = authClient
      .from('audit_log')
      .select(
        `
        id,
        actor_id,
        actor_email,
        entity_type,
        entity_id,
        action,
        description,
        created_at,
        profiles:actor_id(full_name)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (entityId) {
      query = query.eq('entity_id', entityId);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (actorId) {
      query = query.eq('actor_id', actorId);
    }
    if (search) {
      query = query.ilike('description', `%${search}%`);
    }

    // Apply sorting and pagination
    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching audit log:', error);
      return NextResponse.json(
        { error: 'Грешка при обработка' },
        { status: 500 }
      );
    }

    // Format response
    const formattedLogs = logs?.map((log: any) => ({
      id: log.id,
      actor_id: log.actor_id,
      actor_email: log.actor_email,
      actor_name: log.profiles?.full_name || 'System',
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      action: log.action,
      description: log.description,
      created_at: log.created_at,
    })) || [];

    return NextResponse.json({
      logs: formattedLogs,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/audit-log
 * 
 * Create audit log entry (admin only, typically called by system)
 * 
 * Body:
 * {
 *   "entity_type": "request",
 *   "entity_id": "uuid",
 *   "action": "created",
 *   "description": "Request created by user",
 *   "old_values": { ... },
 *   "new_values": { ... },
 *   "changes": { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entity_type,
      entity_id,
      action,
      description,
      old_values,
      new_values,
      changes,
    } = body;

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
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нямате достъп до тази ресурс' },
        { status: 403 }
      );
    }

    // Create audit log entry
    const { data: auditLog, error: insertError } = await authClient
      .from('audit_log')
      .insert({
        actor_id: user.id,
        actor_email: adminProfile.email,
        entity_type,
        entity_id,
        action,
        description,
        old_values,
        new_values,
        changes,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating audit log:', insertError);
      return NextResponse.json(
        { error: 'Грешка при създаване на запис' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        audit_log: auditLog,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: 'Грешка при обработка на заявката' },
      { status: 500 }
    );
  }
}
