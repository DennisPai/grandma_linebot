'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, Upload, Settings, Bot, Brain, Cloud, Lock, Wrench } from 'lucide-react';

interface ValidationResult {
  valid: boolean;
  message?: string;
  error?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>({
    lineBotConfig: { channelSecret: '', channelAccessToken: '' },
    geminiApiKeys: { freeApiKey: '', paidApiKey: '' },
    n8nConfig: { apiUrl: '', apiKey: '' },
    googleDriveConfig: { enabled: false, credentials: {}, folderId: '' },
    aiModelsConfig: {
      linebotReplyModel: 'gemini-2.5-flash',
      aiButlerDefaultModel: 'gemini-2.5-pro',
      morningMessageModel: 'gemini-2.5-flash'
    }
  });
  
  const [showSecrets, setShowSecrets] = useState({
    lineSecret: false,
    lineToken: false,
    geminiFree: false,
    geminiPaid: false,
    n8nKey: false
  });
  
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/system-config');
      const data = await response.json();
      
      const parsedConfig: any = {
        lineBotConfig: { channelSecret: '', channelAccessToken: '' },
        geminiApiKeys: { freeApiKey: '', paidApiKey: '' },
        n8nConfig: { apiUrl: '', apiKey: '' },
        googleDriveConfig: { enabled: false, credentials: {}, folderId: '' },
        aiModelsConfig: {
          linebotReplyModel: 'gemini-2.5-flash',
          aiButlerDefaultModel: 'gemini-2.5-pro',
          morningMessageModel: 'gemini-2.5-flash'
        }
      };
      
      for (const item of data.configs || []) {
        try {
          const value = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
          
          switch (item.key) {
            case 'line_bot_config':
              parsedConfig.lineBotConfig = value;
              break;
            case 'gemini_api_keys':
              parsedConfig.geminiApiKeys = value;
              break;
            case 'n8n_config':
              parsedConfig.n8nConfig = value;
              break;
            case 'google_drive_config':
              parsedConfig.googleDriveConfig = value;
              break;
            case 'ai_models_config':
              parsedConfig.aiModelsConfig = value;
              break;
          }
        } catch (e) {
          console.error('Failed to parse config:', item.key, e);
        }
      }
      
      setConfig(parsedConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (key: string, value: any) => {
    setLoadingStates(prev => ({ ...prev, [`save_${key}`]: true }));
    setSaveMessage(null);
    
    try {
      const response = await fetch('/api/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, shouldEncrypt: true })
      });
      
      if (!response.ok) {
        throw new Error('儲存失敗');
      }
      
      setSaveMessage({ type: 'success', text: '配置已成功儲存' });
      setTimeout(() => setSaveMessage(null), 3000);
      
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || '儲存失敗' });
    } finally {
      setLoadingStates(prev => ({ ...prev, [`save_${key}`]: false }));
    }
  };

  const validateConfig = async (type: string, configData: any) => {
    setLoadingStates(prev => ({ ...prev, [`validate_${type}`]: true }));
    
    try {
      const response = await fetch('/api/system-config/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config: configData })
      });
      
      const result = await response.json();
      setValidationResults(prev => ({ ...prev, [type]: result }));
    } catch (error) {
      setValidationResults(prev => ({
        ...prev,
        [type]: { valid: false, error: '驗證失敗' }
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [`validate_${type}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const PasswordInput = ({ id, value, onChange, label, placeholder, showKey }: any) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showSecrets[showKey as keyof typeof showSecrets] ? 'text' : 'password'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowSecrets(prev => ({ ...prev, [showKey]: !prev[showKey as keyof typeof showSecrets] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showSecrets[showKey as keyof typeof showSecrets] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8" />
            系統設定
          </h1>
          <p className="text-muted-foreground">配置系統的 API 金鑰、模型選擇和其他設定</p>
        </div>

        {saveMessage && (
          <Alert className={saveMessage.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
            {saveMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
            <AlertDescription className={saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {saveMessage.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">基本配置</span>
              <span className="sm:hidden">基本</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI 模型</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger value="drive" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <span className="hidden sm:inline">Google Drive</span>
              <span className="sm:hidden">Drive</span>
            </TabsTrigger>
            <TabsTrigger value="oauth" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              OAuth
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">進階</span>
              <span className="sm:hidden">進階</span>
            </TabsTrigger>
          </TabsList>

          {/* 基本配置 */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Line Bot 配置</CardTitle>
                <CardDescription>設定 Line Messaging API 的認證資訊</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PasswordInput
                  id="line-channel-secret"
                  value={config.lineBotConfig?.channelSecret}
                  onChange={(val: string) => setConfig((prev: any) => ({
                    ...prev,
                    lineBotConfig: { ...prev.lineBotConfig, channelSecret: val }
                  }))}
                  label="Channel Secret"
                  placeholder="輸入您的 Channel Secret"
                  showKey="lineSecret"
                />
                
                <PasswordInput
                  id="line-channel-token"
                  value={config.lineBotConfig?.channelAccessToken}
                  onChange={(val: string) => setConfig((prev: any) => ({
                    ...prev,
                    lineBotConfig: { ...prev.lineBotConfig, channelAccessToken: val }
                  }))}
                  label="Channel Access Token"
                  placeholder="輸入您的 Access Token"
                  showKey="lineToken"
                />
                
                {validationResults.line_bot && (
                  <Alert variant={validationResults.line_bot.valid ? 'default' : 'destructive'}>
                    {validationResults.line_bot.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {validationResults.line_bot.valid 
                        ? `✅ ${validationResults.line_bot.message}`
                        : `❌ ${validationResults.line_bot.error}`
                      }
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => validateConfig('line_bot', config.lineBotConfig)}
                    disabled={loadingStates.validate_line_bot}
                    variant="outline"
                  >
                    {loadingStates.validate_line_bot ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />驗證中...</>
                    ) : (
                      '測試連接'
                    )}
                  </Button>
                  <Button
                    onClick={() => saveConfig('line_bot_config', config.lineBotConfig)}
                    disabled={loadingStates.save_line_bot_config}
                  >
                    {loadingStates.save_line_bot_config ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />儲存中...</>
                    ) : (
                      '儲存配置'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>n8n 整合</CardTitle>
                <CardDescription>設定 n8n 工作流程自動化 API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="n8n-url">API URL</Label>
                  <Input
                    id="n8n-url"
                    type="text"
                    value={config.n8nConfig?.apiUrl || ''}
                    onChange={(e) => setConfig((prev: any) => ({
                      ...prev,
                      n8nConfig: { ...prev.n8nConfig, apiUrl: e.target.value }
                    }))}
                    placeholder="https://your-n8n-domain.zeabur.app/api/v1"
                  />
                </div>
                
                <PasswordInput
                  id="n8n-api-key"
                  value={config.n8nConfig?.apiKey}
                  onChange={(val: string) => setConfig((prev: any) => ({
                    ...prev,
                    n8nConfig: { ...prev.n8nConfig, apiKey: val }
                  }))}
                  label="API KEY"
                  placeholder="輸入您的 n8n API KEY"
                  showKey="n8nKey"
                />
                
                {validationResults.n8n && (
                  <Alert variant={validationResults.n8n.valid ? 'default' : 'destructive'}>
                    {validationResults.n8n.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {validationResults.n8n.valid 
                        ? `✅ ${validationResults.n8n.message}`
                        : `❌ ${validationResults.n8n.error}`
                      }
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => validateConfig('n8n', config.n8nConfig)}
                    disabled={loadingStates.validate_n8n}
                    variant="outline"
                  >
                    {loadingStates.validate_n8n ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />驗證中...</>
                    ) : (
                      '測試連接'
                    )}
                  </Button>
                  <Button
                    onClick={() => saveConfig('n8n_config', config.n8nConfig)}
                    disabled={loadingStates.save_n8n_config}
                  >
                    {loadingStates.save_n8n_config ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />儲存中...</>
                    ) : (
                      '儲存配置'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI 模型配置 */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gemini API 配置</CardTitle>
                <CardDescription>設定免費版和付費版 API KEY 以優化成本</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                  <h3 className="font-semibold text-sm text-foreground">免費版 API KEY</h3>
                  <PasswordInput
                    id="gemini-free-key"
                    value={config.geminiApiKeys?.freeApiKey}
                    onChange={(val: string) => setConfig((prev: any) => ({
                      ...prev,
                      geminiApiKeys: { ...prev.geminiApiKeys, freeApiKey: val }
                    }))}
                    label="免費版 KEY"
                    placeholder="AIzaSy..."
                    showKey="geminiFree"
                  />
                  <p className="text-sm text-muted-foreground">
                    用於：對話回覆、AI 管家、視覺分析、早安訊息
                  </p>
                </div>

                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                  <h3 className="font-semibold text-sm text-foreground">付費版 API KEY</h3>
                  <PasswordInput
                    id="gemini-paid-key"
                    value={config.geminiApiKeys?.paidApiKey}
                    onChange={(val: string) => setConfig((prev: any) => ({
                      ...prev,
                      geminiApiKeys: { ...prev.geminiApiKeys, paidApiKey: val }
                    }))}
                    label="付費版 KEY"
                    placeholder="AIzaSy..."
                    showKey="geminiPaid"
                  />
                  <p className="text-sm text-muted-foreground">
                    用於：圖片生成（寫實照片、長輩圖）
                  </p>
                </div>
                
                {validationResults.gemini_api && (
                  <Alert variant={validationResults.gemini_api.valid ? 'default' : 'destructive'}>
                    {validationResults.gemini_api.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {validationResults.gemini_api.valid 
                        ? `✅ ${validationResults.gemini_api.message}`
                        : `❌ ${validationResults.gemini_api.error}`
                      }
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={async () => {
                      await validateConfig('gemini_api', {
                        apiKey: config.geminiApiKeys?.freeApiKey,
                        tier: 'free'
                      });
                    }}
                    disabled={loadingStates.validate_gemini_api}
                    variant="outline"
                  >
                    {loadingStates.validate_gemini_api ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />驗證中...</>
                    ) : (
                      '驗證 API KEYs'
                    )}
                  </Button>
                  <Button
                    onClick={() => saveConfig('gemini_api_keys', config.geminiApiKeys)}
                    disabled={loadingStates.save_gemini_api_keys}
                  >
                    {loadingStates.save_gemini_api_keys ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />儲存中...</>
                    ) : (
                      '儲存配置'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 模型選擇器 */}
            <Card>
              <CardHeader>
                <CardTitle>模型選擇器</CardTitle>
                <CardDescription>為不同功能選擇適合的 AI 模型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Line Bot 回覆模型</Label>
                    <Select
                      value={config.aiModelsConfig?.linebotReplyModel}
                      onValueChange={(value) => setConfig((prev: any) => ({
                        ...prev,
                        aiModelsConfig: { ...prev.aiModelsConfig, linebotReplyModel: value }
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-2.5-flash">gemini-2.5-flash（免費，快速）</SelectItem>
                        <SelectItem value="gemini-2.5-pro">gemini-2.5-pro（免費，強分析）</SelectItem>
                        <SelectItem value="gemini-3-flash-preview">gemini-3-flash-preview（免費）</SelectItem>
                        <SelectItem value="gemini-3-pro-preview">gemini-3-pro-preview（付費）</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>AI 管家模型</Label>
                    <Select
                      value={config.aiModelsConfig?.aiButlerDefaultModel}
                      onValueChange={(value) => setConfig((prev: any) => ({
                        ...prev,
                        aiModelsConfig: { ...prev.aiModelsConfig, aiButlerDefaultModel: value }
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-2.5-flash">gemini-2.5-flash（免費，快速）</SelectItem>
                        <SelectItem value="gemini-2.5-pro">gemini-2.5-pro（免費，推薦）</SelectItem>
                        <SelectItem value="gemini-3-pro-preview">gemini-3-pro-preview（付費，最強）</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>早安訊息模型</Label>
                    <Select
                      value={config.aiModelsConfig?.morningMessageModel}
                      onValueChange={(value) => setConfig((prev: any) => ({
                        ...prev,
                        aiModelsConfig: { ...prev.aiModelsConfig, morningMessageModel: value }
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-2.5-flash">gemini-2.5-flash（推薦）</SelectItem>
                        <SelectItem value="gemini-2.5-pro">gemini-2.5-pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={() => saveConfig('ai_models_config', config.aiModelsConfig)}
                  disabled={loadingStates.save_ai_models_config}
                  className="mt-4"
                >
                  {loadingStates.save_ai_models_config ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />儲存中...</>
                  ) : (
                    '儲存模型配置'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Google Drive 配置 */}
          <TabsContent value="drive">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Google Drive 配置
                </CardTitle>
                <CardDescription>設定圖片永久儲存（可選功能）</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="drive-enabled" className="text-base">啟用 Google Drive</Label>
                    <p className="text-sm text-muted-foreground">永久儲存所有生成的圖片</p>
                  </div>
                  <Switch
                    id="drive-enabled"
                    checked={config.googleDriveConfig?.enabled || false}
                    onCheckedChange={(checked) => setConfig((prev: any) => ({
                      ...prev,
                      googleDriveConfig: { ...prev.googleDriveConfig, enabled: checked }
                    }))}
                  />
                </div>

                {config.googleDriveConfig?.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="drive-credentials">Service Account JSON</Label>
                      <textarea
                        id="drive-credentials"
                        className="w-full p-3 border rounded-md font-mono text-sm min-h-[150px]"
                        value={typeof config.googleDriveConfig?.credentials === 'string' 
                          ? config.googleDriveConfig.credentials 
                          : JSON.stringify(config.googleDriveConfig?.credentials || {}, null, 2)
                        }
                        onChange={(e) => {
                          try {
                            const creds = JSON.parse(e.target.value);
                            setConfig((prev: any) => ({
                              ...prev,
                              googleDriveConfig: { ...prev.googleDriveConfig, credentials: creds }
                            }));
                          } catch {
                            // 保持原樣直到 JSON 有效
                          }
                        }}
                        placeholder='{"type": "service_account", ...}'
                      />
                      <p className="text-sm text-muted-foreground">
                        貼上從 Google Cloud Console 下載的 Service Account JSON
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="drive-folder">資料夾 ID</Label>
                      <Input
                        id="drive-folder"
                        value={config.googleDriveConfig?.folderId || ''}
                        onChange={(e) => setConfig((prev: any) => ({
                          ...prev,
                          googleDriveConfig: { ...prev.googleDriveConfig, folderId: e.target.value }
                        }))}
                        placeholder="1AbC2dEfGhIjKlMnOpQrStUvWxYz"
                      />
                      <p className="text-sm text-muted-foreground">
                        Google Drive 資料夾 URL 中 /folders/ 後面的 ID
                      </p>
                    </div>
                    
                    {validationResults.google_drive && (
                      <Alert variant={validationResults.google_drive.valid ? 'default' : 'destructive'}>
                        {validationResults.google_drive.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <AlertDescription>
                          {validationResults.google_drive.valid 
                            ? `✅ ${validationResults.google_drive.message}`
                            : `❌ ${validationResults.google_drive.error}`
                          }
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => validateConfig('google_drive', config.googleDriveConfig)}
                        disabled={loadingStates.validate_google_drive}
                        variant="outline"
                      >
                        {loadingStates.validate_google_drive ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />驗證中...</>
                        ) : (
                          '測試連接'
                        )}
                      </Button>
                      <Button
                        onClick={() => saveConfig('google_drive_config', config.googleDriveConfig)}
                        disabled={loadingStates.save_google_drive_config}
                      >
                        {loadingStates.save_google_drive_config ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />儲存中...</>
                        ) : (
                          '儲存配置'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OAuth 配置 */}
          <TabsContent value="oauth">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Google OAuth</CardTitle>
                  <CardDescription>用於後台登入</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Callback URL</strong>（請在 Google Cloud Console 中設定）：<br />
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded mt-2 inline-block text-xs">
                        {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/google` : 'https://your-domain/api/auth/callback/google'}
                      </code>
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    OAuth 配置需要在 Zeabur 環境變數中設定 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Line Login（可選）</CardTitle>
                  <CardDescription>使用 Line 帳號登入後台</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Callback URL</strong>：<br />
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded mt-2 inline-block text-xs">
                        {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/line` : 'https://your-domain/api/auth/callback/line'}
                      </code>
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Line Login 配置需要在 Zeabur 環境變數中設定 LINE_LOGIN_CHANNEL_ID 和 LINE_LOGIN_CHANNEL_SECRET
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 進階設定 */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  進階配置
                </CardTitle>
                <CardDescription>內部 API URLs 和進階系統設定</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    ⚠️ 這些 URL 會在首次部署時自動設定。除非使用自訂網域，否則不建議修改。
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>LineBot API URL</Label>
                  <Input
                    value={typeof window !== 'undefined' ? window.location.origin.replace('admin', 'linebot-api') : ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Admin Dashboard URL</Label>
                  <Input
                    value={typeof window !== 'undefined' ? window.location.origin : ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
