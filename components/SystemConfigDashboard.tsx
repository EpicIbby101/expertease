'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  Info,
  Shield,
  Mail,
  Building,
  Users,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description: string;
  category: string;
  data_type: string;
  is_public: boolean;
  is_required: boolean;
  validation_rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

interface SystemConfigDashboardProps {
  initialConfigs?: SystemConfig[];
}

export function SystemConfigDashboard({ initialConfigs = [] }: SystemConfigDashboardProps) {
  const [configs, setConfigs] = useState<SystemConfig[]>(initialConfigs);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingConfigs, setEditingConfigs] = useState<Record<string, any>>({});

  // Group configs by category
  const configsByCategory = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, SystemConfig[]>);

  // Get category icon and color
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'invitations':
        return { icon: Mail, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'companies':
        return { icon: Building, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'security':
        return { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'email':
        return { icon: Mail, color: 'text-purple-600', bgColor: 'bg-purple-100' };
      case 'platform':
        return { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-100' };
      case 'analytics':
        return { icon: BarChart3, color: 'text-orange-600', bgColor: 'bg-orange-100' };
      case 'audit':
        return { icon: Shield, color: 'text-indigo-600', bgColor: 'bg-indigo-100' };
      case 'features':
        return { icon: Users, color: 'text-pink-600', bgColor: 'bg-pink-100' };
      default:
        return { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  // Handle config value change
  const handleConfigChange = (key: string, value: any) => {
    setEditingConfigs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save all changes
  const saveChanges = async () => {
    if (Object.keys(editingConfigs).length === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/system-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          configs: editingConfigs,
          userId: null // Will be handled by the server
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save configurations');
      }

      toast.success('Configurations saved successfully');
      setEditingConfigs({});
      
      // Refresh configs
      await fetchConfigs();
    } catch (error) {
      console.error('Error saving configs:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configurations');
    } finally {
      setSaving(false);
    }
  };

  // Fetch configs
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system-config');
      const data = await response.json();
      
      if (response.ok) {
        setConfigs(data.configs);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render config input based on data type
  const renderConfigInput = (config: SystemConfig) => {
    const value = editingConfigs[config.key] !== undefined ? editingConfigs[config.key] : config.value;
    const hasChanges = editingConfigs[config.key] !== undefined && editingConfigs[config.key] !== config.value;

    switch (config.data_type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleConfigChange(config.key, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">{value ? 'Enabled' : 'Disabled'}</span>
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleConfigChange(config.key, parseFloat(e.target.value) || 0)}
            className={hasChanges ? 'border-blue-500' : ''}
          />
        );

      case 'json':
        return (
          <Textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleConfigChange(config.key, parsed);
              } catch {
                handleConfigChange(config.key, e.target.value);
              }
            }}
            className={`font-mono text-sm ${hasChanges ? 'border-blue-500' : ''}`}
            rows={3}
          />
        );

      case 'array':
        return (
          <Textarea
            value={Array.isArray(value) ? value.join('\n') : value}
            onChange={(e) => {
              const arrayValue = e.target.value.split('\n').filter(item => item.trim());
              handleConfigChange(config.key, arrayValue);
            }}
            className={`font-mono text-sm ${hasChanges ? 'border-blue-500' : ''}`}
            rows={3}
            placeholder="One item per line"
          />
        );

      default: // string
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleConfigChange(config.key, e.target.value)}
            className={hasChanges ? 'border-blue-500' : ''}
          />
        );
    }
  };

  // Get validation info
  const getValidationInfo = (config: SystemConfig) => {
    if (!config.validation_rules) return null;

    const rules = config.validation_rules;
    const info = [];

    if (rules.min !== undefined) info.push(`Min: ${rules.min}`);
    if (rules.max !== undefined) info.push(`Max: ${rules.max}`);
    if (rules.minLength !== undefined) info.push(`Min length: ${rules.minLength}`);
    if (rules.maxLength !== undefined) info.push(`Max length: ${rules.maxLength}`);
    if (rules.pattern) info.push(`Pattern: ${rules.pattern}`);
    if (rules.enum) info.push(`Options: ${rules.enum.join(', ')}`);

    return info.length > 0 ? info.join(' • ') : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
          <p className="text-gray-600">Manage platform-wide settings and configuration options</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchConfigs} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={saveChanges} 
            disabled={saving || Object.keys(editingConfigs).length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue={Object.keys(configsByCategory)[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {Object.keys(configsByCategory).map((category) => {
            const { icon: Icon, color } = getCategoryInfo(category);
            return (
              <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="hidden sm:inline">{category}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(configsByCategory).map(([category, categoryConfigs]) => {
          const { icon: Icon, color, bgColor } = getCategoryInfo(category);
          
          return (
            <TabsContent key={category} value={category} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${bgColor}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    {category.charAt(0).toUpperCase() + category.slice(1)} Settings
                  </CardTitle>
                  <CardDescription>
                    Configure {category} related settings and options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {categoryConfigs.map((config) => {
                    const hasChanges = editingConfigs[config.key] !== undefined && editingConfigs[config.key] !== config.value;
                    const validationInfo = getValidationInfo(config);

                    return (
                      <div key={config.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={config.key} className="font-medium">
                              {config.key.replace(/_/g, ' ')}
                            </Label>
                            {config.is_required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            {config.is_public && (
                              <Badge variant="secondary" className="text-xs">Public</Badge>
                            )}
                            {hasChanges && (
                              <Badge variant="default" className="text-xs bg-blue-600">Modified</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {config.data_type}
                            </Badge>
                          </div>
                        </div>

                        {config.description && (
                          <p className="text-sm text-gray-600">{config.description}</p>
                        )}

                        {validationInfo && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {validationInfo}
                          </p>
                        )}

                        {renderConfigInput(config)}

                        {config.updated_at && (
                          <p className="text-xs text-gray-400">
                            Last updated: {new Date(config.updated_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Unsaved Changes Indicator */}
      <div className="flex items-center justify-end">
        <div className="text-sm text-gray-500">
          {Object.keys(editingConfigs).length} unsaved changes
        </div>
      </div>

      {/* Save Status */}
      {Object.keys(editingConfigs).length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">You have unsaved changes</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              {Object.keys(editingConfigs).length} configuration(s) have been modified. 
              Click "Save Changes" to apply them.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
