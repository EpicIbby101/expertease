import { NextRequest, NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth';
import { SystemConfigManager } from '@/lib/system-config';
import { AuditLogger } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    // Check if user is site admin
    const role = await getUserRole();
    if (role !== 'site_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let configs;
    if (category) {
      configs = await SystemConfigManager.getByCategory(category as any);
    } else {
      configs = await SystemConfigManager.getAll();
    }

    return NextResponse.json({ configs });

  } catch (error) {
    console.error('System config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is site admin
    const role = await getUserRole();
    if (role !== 'site_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, userId } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const success = await SystemConfigManager.set(key, value, userId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
    }

    // Log the configuration change
    await AuditLogger.log({
      userId,
      action: 'system_config_updated',
      resourceType: 'system_config',
      resourceId: key,
      oldValues: null, // Could fetch old value if needed
      newValues: { [key]: value },
      metadata: { key, value },
      ...AuditLogger.extractClientInfo(request)
    });

    return NextResponse.json({ message: 'Configuration updated successfully' });

  } catch (error) {
    console.error('System config PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check if user is site admin
    const role = await getUserRole();
    if (role !== 'site_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { configs, userId } = body;

    if (!configs || typeof configs !== 'object') {
      return NextResponse.json({ error: 'Configs object is required' }, { status: 400 });
    }

    // Get the current user ID from auth if not provided
    const currentUserId = userId || null; // For now, we'll use null since we don't have user context in API routes

    const success = await SystemConfigManager.setMultiple(configs, currentUserId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update configurations' }, { status: 500 });
    }

    // Log the bulk configuration change
    await AuditLogger.log({
      userId: currentUserId,
      action: 'system_config_updated',
      resourceType: 'system_config',
      oldValues: null,
      newValues: configs,
      metadata: { configCount: Object.keys(configs).length },
      ...AuditLogger.extractClientInfo(request)
    });

    return NextResponse.json({ message: 'Configurations updated successfully' });

  } catch (error) {
    console.error('System config PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
