'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Bot, 
  Brain, 
  Activity,
  Sparkles
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const STEPS = [
  { id: 'line', title: 'Line Bot 配置', icon: Bot },
  { id: 'gemini', title: 'Gemini API', icon: Brain },
  { id: 'n8n', title: 'n8n 自動化', icon: Activity },
  { id: 'complete', title: '完成', icon: Sparkles }
];

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState({
    lineChannelSecret: '',
    lineChannelAccessToken: '',
    geminiFreeApiKey: '',
    geminiPaidApiKey: '',
    n8nApiUrl: '',
    n8nApiKey: ''
  });
  const [saving, setSaving] = useState(false);

  const CurrentStepIcon = STEPS[currentStep].icon;

  const handleNext = async () => {
    if (currentStep === STEPS.length - 2) {
      // 最後一步前儲存所有配置
      setSaving(true);
      
      try {
        await Promise.all([
          saveConfig('line_bot_config', {
            channelSecret: config.lineChannelSecret,
            channelAccessToken: config.lineChannelAccessToken
          }),
          saveConfig('gemini_api_keys', {
            freeApiKey: config.geminiFreeApiKey,
            paidApiKey: config.geminiPaidApiKey
          }),
          saveConfig('n8n_config', {
            apiUrl: config.n8nApiUrl,
            apiKey: config.n8nApiKey
          })
        ]);
        
        setCurrentStep(currentStep + 1);
      } catch (error) {
        console.error('Failed to save config:', error);
      } finally {
        setSaving(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveConfig = async (key: string, value: any) => {
    const response = await fetch('/api/system-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, shouldEncrypt: true })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save ${key}`);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Line Bot
        return config.lineChannelSecret && config.lineChannelAccessToken;
      case 1: // Gemini
        return config.geminiFreeApiKey;
      case 2: // n8n
        return config.n8nApiUrl && config.n8nApiKey;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <CurrentStepIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                🎉 歡迎使用阿東 Line Bot 系統！
              </CardTitle>
              <CardDescription>讓我們快速設定系統...</CardDescription>
            </div>
          </div>
          
          {/* 進度指示器 */}
          <div className="flex gap-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full ${
                  index <= currentStep ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            步驟 {currentStep + 1}/{STEPS.length}: {STEPS[currentStep].title}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 步驟 1: Line Bot 配置 */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Alert>
                <Bot className="h-4 w-4" />
                <AlertDescription>
                  設定 Line Bot 認證資訊，讓系統能夠與 Line 平台通訊
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="wiz-line-secret">Channel Secret</Label>
                <Input
                  id="wiz-line-secret"
                  type="password"
                  value={config.lineChannelSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, lineChannelSecret: e.target.value }))}
                  placeholder="輸入您的 Line Channel Secret"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wiz-line-token">Channel Access Token</Label>
                <Input
                  id="wiz-line-token"
                  type="password"
                  value={config.lineChannelAccessToken}
                  onChange={(e) => setConfig(prev => ({ ...prev, lineChannelAccessToken: e.target.value }))}
                  placeholder="輸入您的 Channel Access Token"
                />
              </div>
            </div>
          )}

          {/* 步驟 2: Gemini API */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  設定 Gemini API KEY，系統需要至少一個免費版 KEY 才能運作
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="wiz-gemini-free">免費版 API KEY（必填）</Label>
                <Input
                  id="wiz-gemini-free"
                  type="password"
                  value={config.geminiFreeApiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, geminiFreeApiKey: e.target.value }))}
                  placeholder="AIzaSy..."
                />
                <p className="text-xs text-gray-500">用於：對話回覆、AI 管家、早安訊息</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wiz-gemini-paid">付費版 API KEY（可選）</Label>
                <Input
                  id="wiz-gemini-paid"
                  type="password"
                  value={config.geminiPaidApiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, geminiPaidApiKey: e.target.value }))}
                  placeholder="AIzaSy..."
                />
                <p className="text-xs text-gray-500">用於：圖片生成功能（可稍後設定）</p>
              </div>
            </div>
          )}

          {/* 步驟 3: n8n 配置 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  設定 n8n API，讓系統能夠自動部署和管理工作流程
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="wiz-n8n-url">n8n API URL</Label>
                <Input
                  id="wiz-n8n-url"
                  type="url"
                  value={config.n8nApiUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, n8nApiUrl: e.target.value }))}
                  placeholder="https://your-n8n.zeabur.app/api/v1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wiz-n8n-key">n8n API KEY</Label>
                <Input
                  id="wiz-n8n-key"
                  type="password"
                  value={config.n8nApiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, n8nApiKey: e.target.value }))}
                  placeholder="eyJhbGci..."
                />
              </div>
            </div>
          )}

          {/* 步驟 4: 完成 */}
          {currentStep === 3 && (
            <div className="space-y-4 text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">🎉 設定完成！</h2>
              <p className="text-gray-600">
                系統已準備就緒，您可以開始使用所有功能。
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 text-left">
                <h3 className="font-semibold text-sm mb-2">接下來可以：</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✅ 在「n8n 工作流程」頁面部署自動化流程</li>
                  <li>✅ 在「文檔知識庫」上傳參考文件</li>
                  <li>✅ 在「用戶管理」查看 Line Bot 用戶</li>
                  <li>✅ 與「AI 管家」對話了解系統狀況</li>
                </ul>
              </div>
            </div>
          )}

          {/* 按鈕 */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {currentStep > 0 && currentStep < STEPS.length - 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  上一步
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {currentStep < STEPS.length - 1 && (
                <Button variant="ghost" onClick={onSkip}>
                  跳過
                </Button>
              )}
              
              {currentStep < STEPS.length - 1 ? (
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed() || saving}
                >
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />儲存中...</>
                  ) : (
                    <>下一步<ChevronRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              ) : (
                <Button onClick={onComplete}>
                  開始使用
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
