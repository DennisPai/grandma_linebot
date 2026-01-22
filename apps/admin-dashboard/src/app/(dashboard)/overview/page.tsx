export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">總覽儀表板</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 統計卡片 - 將使用 Magic MCP 生成 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">今日活躍用戶</div>
          <div className="text-3xl font-bold">0</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">待審核訊息</div>
          <div className="text-3xl font-bold">0</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">今日對話總數</div>
          <div className="text-3xl font-bold">0</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">系統狀態</div>
          <div className="text-lg font-semibold text-green-600">正常運作</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">最近對話動態</h2>
        <p className="text-gray-500">即時對話列表將在此顯示...</p>
      </div>
    </div>
  );
}
