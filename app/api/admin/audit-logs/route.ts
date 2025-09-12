import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check if user is site admin
    const role = await getUserRole();
    if (role !== 'site_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Filters
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resource_type');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const userId = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        metadata,
        ip_address,
        user_agent,
        severity,
        category,
        created_at,
        users!audit_logs_user_id_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (action) query = query.eq('action', action);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (category) query = query.eq('category', category);
    if (severity) query = query.eq('severity', severity);
    if (userId) query = query.eq('user_id', userId);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    if (search) {
      query = query.or(`action.ilike.%${search}%,resource_type.ilike.%${search}%`);
    }

    const { data: auditLogs, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      auditLogs: auditLogs || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is site admin
    const role = await getUserRole();
    if (role !== 'site_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('older_than'); // days

    if (!olderThan) {
      return NextResponse.json({ error: 'older_than parameter is required' }, { status: 400 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));

    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error deleting old audit logs:', error);
      return NextResponse.json({ error: 'Failed to delete old audit logs' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Old audit logs deleted successfully' });

  } catch (error) {
    console.error('Delete audit logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

