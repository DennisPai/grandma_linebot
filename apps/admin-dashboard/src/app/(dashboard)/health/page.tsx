'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Database,
  Bot,
  Brain,
  Cloud,
  Activity,
  AlertCircle
} from 'lucide-react';

interface HealthStatus {
  healthy: boolean;
  message?: string;
  error?: string;
}

interface HealthCheckResult {
  healthy: boolean;
  services: {
    database: HealthStatus;
    lineBotApi: HealthStatus;
    geminiApiFree: HealthStatus;
    geminiApiPaid: HealthStatus;
    n8nApi: HealthStatus;
    googleDrive: HealthStatus;
  };
  timestamp: string;
}

export default function HealthPage() {
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setChecking(true);
    
    try {
      const response = await fetch('/api/system-config/health');
      const data = await response.json();
      
      if (response.ok) {
        setHealthData(data);
      }
    } catch (error) {
      console.error('Failed to check health:', error);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'lineBotApi':
        return <Bot className="h-5 w-5" />;
      case 'geminiApiFree':
      case 'geminiApiPaid':
        return <Brain className="h-5 w-5" />;
      case 'n8nApi':
        return <Activity className="h-5 w-5" />;
      case 'googleDrive':
        return <Cloud className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getServiceDisplayName = (serviceName: string) => {
    const names: Record<string, string> = {
      database: '資料庫',
      lineBotApi: 'Line Bot API',
      geminiApiFree: 'Gemini API (免費版)',
      geminiApiPaid: 'Gemini API (付費版)',
      n8nApi: 'n8n',
      googleDrive: 'Google Drive'
    };
    return names[serviceName] || serviceName;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">🏥 系統健康檢查</h1>
          <p className="text-gray-600">監控所有服務的健康狀態</p>
        </div>
        <Button onClick={checkHealth} disabled={checking}>
          {checking ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />檢查中...</>
          ) : (
            <><RefreshCw className="mr-2 h-4 w-4" />執行完整檢查</>
          )}
        </Button>
      </div>

      {/* 整體狀態 */}
      {healthData && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {healthData.healthy ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {healthData.healthy ? '✅ 所有服務正常' : '⚠️ 部分服務異常'}
                </h2>
                <p className="text-sm text-gray-600">
                  最後檢查: {new Date(healthData.timestamp).toLocaleString('zh-TW')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 服務狀態列表 */}
      <div className="space-y-4">
        {healthData && Object.entries(healthData.services).map(([key, status]) => (
          <Card key={key} className={status.healthy ? '' : 'border-red-300'}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getServiceIcon(key)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{getServiceDisplayName(key)}</h3>
                    {status.healthy ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        正常
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        異常
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${status.healthy ? 'text-gray-600' : 'text-red-600'}`}>
                    {status.message || status.error || '未知狀態'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
