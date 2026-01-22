'use client';

import { useState } from 'react';

export default function AIButlerPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-pro');

  const models = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash（免費，快速）' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro（免費，更強分析）' },
    { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview（免費，最新）' },
    { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro Preview（付費，最強）' }
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // 新增用戶訊息
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-model': selectedModel
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
          }))
        })
      });

      const data = await response.json();

      // 新增 AI 回覆
      setMessages(prev => [...prev, {
        role: 'model',
        content: data.response,
        modelUsed: data.modelUsed
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'error',
        content: '抱歉，發生錯誤，請稍後再試。'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">🤖 AI 管家</h1>
        
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          {models.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow min-h-[600px] flex flex-col">
        {/* 對話區域 */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-lg mb-4">👋 您好！我是 AI 管家</p>
              <p className="text-sm">您可以問我：</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• 用戶最近的狀態如何？</li>
                <li>• 哪些用戶需要特別關注？</li>
                <li>• 最近的對話主題有哪些？</li>
                <li>• 幫我生成本週對話摘要</li>
              </ul>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : msg.role === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.modelUsed && (
                  <p className="text-xs mt-2 opacity-70">模型：{msg.modelUsed}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-500">思考中...</p>
              </div>
            </div>
          )}
        </div>

        {/* 輸入區域 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="輸入您的問題..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              發送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
