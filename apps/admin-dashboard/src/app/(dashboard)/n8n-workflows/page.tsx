'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  PlayCircle, 
  PauseCircle,
  Activity,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  lastExecution: {
    startedAt: string;
    stoppedAt: string;
    status: string;
    mode: string;
  } | null;
}

export default function N8nWorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const [deployResult, setDeployResult] = useState<any>(null);

  useEffect(() => {
    loadWorkflows();
    loadStatus();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/n8n/deploy/workflows');
      const data = await response.json();
      
      if (response.ok) {
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/n8n/status');
      const data = await response.json();
      setStatusInfo(data);
    } catch (error) {
      console.error('Failed to load n8n status:', error);
    }
  };

  const deployAllWorkflows = async () => {
    setDeploying(true);
    setDeployResult(null);
    
    try {
      const response = await fetch('/api/n8n/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deployAll: true })
      });
      
      const result = await response.json();
      setDeployResult(result);
      
      if (result.success) {
        await loadWorkflows();
      }
    } catch (error: any) {
      setDeployResult({
        success: false,
        error: error.message || '部署失敗'
      });
    } finally {
      setDeploying(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '從未執行';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} 小時前`;
    return `${Math.floor(diffMins / 1440)} 天前`;
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">未知</Badge>;
    
    switch (status.toLowerCase()) {
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600">成功</Badge>;
      case 'error':
        return <Badge variant="destructive">失敗</Badge>;
      case 'running':
        return <Badge className="bg-blue-500 hover:bg-blue-600">執行中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Activity className="h-8 w-8" />
          🔄 n8n 工作流程管理
        </h1>
        <p className="text-gray-600">管理和部署 n8n 自動化工作流程</p>
      </div>

      {/* 連接狀態 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">📊 連接狀態</CardTitle>
        </CardHeader>
        <CardContent>
          {statusInfo ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">n8n 狀態:</span>
                {statusInfo.connected ? (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    已連接
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    未連接
                  </Badge>
                )}
              </div>
              {statusInfo.apiUrl && (
                <div className="text-sm text-gray-600">
                  API URL: <code className="bg-gray-100 px-2 py-1 rounded">{statusInfo.apiUrl}</code>
                </div>
              )}
              {statusInfo.workflowCount !== undefined && (
                <div className="text-sm text-gray-600">
                  工作流程數量: {statusInfo.workflowCount} 個（啟用: {statusInfo.activeWorkflowCount || 0} 個）
                </div>
              )}
              {statusInfo.error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{statusInfo.error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">正在載入狀態...</p>
          )}
        </CardContent>
      </Card>

      {/* 部署操作 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">🚀 部署操作</CardTitle>
          <CardDescription>一鍵部署所有工作流程到 n8n 平台</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={deployAllWorkflows}
            disabled={deploying || !statusInfo?.connected}
            size="lg"
            className="w-full sm:w-auto"
          >
            {deploying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                部署中...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                🔄 重新部署所有工作流程
              </>
            )}
          </Button>
          
          {!statusInfo?.connected && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                請先在系統設定中配置 n8n API URL 和 API KEY
              </AlertDescription>
            </Alert>
          )}
          
          {deployResult && (
            <Alert variant={deployResult.success ? 'default' : 'destructive'}>
              {deployResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {deployResult.success ? (
                  <div>
                    <p className="font-semibold">✅ 部署成功！</p>
                    <p className="text-sm mt-1">
                      成功: {deployResult.summary?.success || 0} 個 | 
                      失敗: {deployResult.summary?.failed || 0} 個
                    </p>
                  </div>
                ) : (
                  <p>❌ {deployResult.error || '部署失敗'}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 工作流程列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📝 工作流程列表</CardTitle>
          <CardDescription>已部署的 n8n 工作流程</CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>尚未部署任何工作流程</p>
              <p className="text-sm mt-1">點擊上方的「重新部署所有工作流程」按鈕開始</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {workflow.active ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <PauseCircle className="h-5 w-5 text-gray-400" />
                        )}
                        <h3 className="font-semibold">{workflow.name}</h3>
                        {workflow.active ? (
                          <Badge className="bg-green-500 hover:bg-green-600">啟用</Badge>
                        ) : (
                          <Badge variant="outline">停用</Badge>
                        )}
                      </div>
                      
                      {workflow.lastExecution ? (
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>最後執行: {formatTime(workflow.lastExecution.stoppedAt)}</span>
                            {getStatusBadge(workflow.lastExecution.status)}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">尚未執行</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        查看詳情
                      </Button>
                      <Button 
                        variant={workflow.active ? "outline" : "default"} 
                        size="sm"
                      >
                        {workflow.active ? '停用' : '啟用'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
