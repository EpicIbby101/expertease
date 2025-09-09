import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type ConfigDataType = 'string' | 'number' | 'boolean' | 'json' | 'array';
export type ConfigCategory = 'invitations' | 'companies' | 'security' | 'email' | 'platform' | 'analytics' | 'audit' | 'features';

export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description: string;
  category: ConfigCategory;
  data_type: ConfigDataType;
  is_public: boolean;
  is_required: boolean;
  validation_rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export class SystemConfigManager {
  /**
   * Get a configuration value by key
   */
  static async get(key: string): Promise<any> {
    const { data, error } = await supabase
      .from('system_config')
      .select('value, data_type')
      .eq('key', key)
      .single();

    if (error) {
      console.error(`Error fetching config ${key}:`, error);
      return null;
    }

    return this.parseValue(data.value, data.data_type);
  }

  /**
   * Get multiple configuration values by keys
   */
  static async getMultiple(keys: string[]): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from('system_config')
      .select('key, value, data_type')
      .in('key', keys);

    if (error) {
      console.error('Error fetching multiple configs:', error);
      return {};
    }

    const result: Record<string, any> = {};
    data.forEach(item => {
      result[item.key] = this.parseValue(item.value, item.data_type);
    });

    return result;
  }

  /**
   * Get all configurations by category
   */
  static async getByCategory(category: ConfigCategory): Promise<SystemConfig[]> {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .eq('category', category)
      .order('key');

    if (error) {
      console.error(`Error fetching configs for category ${category}:`, error);
      return [];
    }

    return data || [];
  }

  /**
   * Get all public configurations
   */
  static async getPublic(): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from('system_config')
      .select('key, value, data_type')
      .eq('is_public', true);

    if (error) {
      console.error('Error fetching public configs:', error);
      return {};
    }

    const result: Record<string, any> = {};
    data.forEach(item => {
      result[item.key] = this.parseValue(item.value, item.data_type);
    });

    return result;
  }

  /**
   * Set a configuration value
   */
  static async set(key: string, value: any, userId?: string): Promise<boolean> {
    try {
      // Get existing config to determine data type
      const { data: existing } = await supabase
        .from('system_config')
        .select('data_type, validation_rules')
        .eq('key', key)
        .single();

      if (!existing) {
        console.error(`Configuration key ${key} not found`);
        return false;
      }

      // Validate value
      if (!this.validateValue(value, existing.data_type, existing.validation_rules)) {
        console.error(`Invalid value for config ${key}`);
        return false;
      }

      const { error } = await supabase
        .from('system_config')
        .update({
          value: this.serializeValue(value, existing.data_type),
          updated_by: userId || null
        })
        .eq('key', key);

      if (error) {
        console.error(`Error updating config ${key}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error setting config ${key}:`, error);
      return false;
    }
  }

  /**
   * Set multiple configuration values
   */
  static async setMultiple(configs: Record<string, any>, userId?: string): Promise<boolean> {
    try {
      // Get existing configs to determine their data types
      const { data: existingConfigs, error: fetchError } = await supabase
        .from('system_config')
        .select('key, data_type, validation_rules')
        .in('key', Object.keys(configs));

      if (fetchError) {
        console.error('Error fetching existing configs:', fetchError);
        return false;
      }

      // Create a map of key to config info
      const configMap = new Map(
        existingConfigs.map(config => [config.key, config])
      );

      const updates = Object.entries(configs).map(([key, value]) => {
        const existingConfig = configMap.get(key);
        if (!existingConfig) {
          console.error(`Configuration key ${key} not found`);
          return null;
        }

        // Validate value
        if (!this.validateValue(value, existingConfig.data_type, existingConfig.validation_rules)) {
          console.error(`Invalid value for config ${key}`);
          return null;
        }

        return {
          key,
          value: this.serializeValue(value, existingConfig.data_type),
          category: existingConfig.category,
          data_type: existingConfig.data_type,
          updated_by: userId || null
        };
      }).filter(Boolean);

      if (updates.length === 0) {
        console.error('No valid updates to process');
        return false;
      }

      // Update each config individually to avoid constraint issues
      for (const update of updates) {
        const { error } = await supabase
          .from('system_config')
          .update({
            value: update.value,
            updated_by: update.updated_by
          })
          .eq('key', update.key);

        if (error) {
          console.error(`Error updating config ${update.key}:`, error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error setting multiple configs:', error);
      return false;
    }
  }

  /**
   * Get all configurations (admin only)
   */
  static async getAll(): Promise<SystemConfig[]> {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .order('category, key');

    if (error) {
      console.error('Error fetching all configs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Parse value based on data type
   */
  private static parseValue(value: any, dataType: ConfigDataType): any {
    switch (dataType) {
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value);
      case 'boolean':
        return typeof value === 'boolean' ? value : value === 'true' || value === true;
      case 'json':
        return typeof value === 'string' ? JSON.parse(value) : value;
      case 'array':
        return Array.isArray(value) ? value : JSON.parse(value);
      case 'string':
      default:
        return value;
    }
  }

  /**
   * Serialize value for storage
   */
  private static serializeValue(value: any, dataType: ConfigDataType): any {
    switch (dataType) {
      case 'json':
      case 'array':
        return typeof value === 'string' ? value : JSON.stringify(value);
      default:
        return value;
    }
  }

  /**
   * Validate value against data type and rules
   */
  private static validateValue(value: any, dataType: ConfigDataType, rules?: Record<string, any>): boolean {
    // Basic type validation
    switch (dataType) {
      case 'number':
        if (typeof value !== 'number' && isNaN(parseFloat(value))) return false;
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') return false;
        break;
      case 'json':
        try {
          if (typeof value === 'string') JSON.parse(value);
        } catch {
          return false;
        }
        break;
      case 'array':
        if (!Array.isArray(value) && typeof value !== 'string') return false;
        break;
    }

    // Custom validation rules
    if (rules) {
      if (rules.min && parseFloat(value) < rules.min) return false;
      if (rules.max && parseFloat(value) > rules.max) return false;
      if (rules.minLength && value.length < rules.minLength) return false;
      if (rules.maxLength && value.length > rules.maxLength) return false;
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) return false;
      if (rules.enum && !rules.enum.includes(value)) return false;
    }

    return true;
  }

  /**
   * Get configuration with caching (for frequently accessed configs)
   */
  private static cache = new Map<string, { value: any; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async getCached(key: string): Promise<any> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    const value = await this.get(key);
    if (value !== null) {
      this.cache.set(key, { value, timestamp: Date.now() });
    }

    return value;
  }

  /**
   * Clear configuration cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get common configuration values
   */
  static async getCommon(): Promise<{
    invitationExpiryDays: number;
    maxCompanyTrainees: number;
    passwordMinLength: number;
    sessionTimeoutHours: number;
    maintenanceMode: boolean;
    platformName: string;
  }> {
    const configs = await this.getMultiple([
      'invitation_expiry_days',
      'max_company_trainees',
      'password_min_length',
      'session_timeout_hours',
      'maintenance_mode',
      'platform_name'
    ]);

    return {
      invitationExpiryDays: configs.invitation_expiry_days || 7,
      maxCompanyTrainees: configs.max_company_trainees || 100,
      passwordMinLength: configs.password_min_length || 8,
      sessionTimeoutHours: configs.session_timeout_hours || 24,
      maintenanceMode: configs.maintenance_mode || false,
      platformName: configs.platform_name || 'Expert Ease'
    };
  }
}
