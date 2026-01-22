import { redirect } from 'next/navigation';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // TODO: 實作 Auth 檢查
  // const session = await getServerSession();
  // if (!session) {
  //   redirect('/login');
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 側邊欄 */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-6">
        <h2 className="text-2xl font-bold mb-8">阿東管理後台</h2>
        
        <nav className="space-y-2">
          <a href="/dashboard/overview" className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            📊 總覽儀表板
          </a>
          <a href="/dashboard/conversations" className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            💬 對話監控
          </a>
          <a href="/dashboard/messages" className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            📝 訊息審核
          </a>
          <a href="/dashboard/users" className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            👥 用戶管理
          </a>
          <a href="/dashboard/documents" className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            📚 文檔知識庫
          </a>
          <a href="/dashboard/ai-butler" className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            🤖 AI 管家
          </a>
          <a href="/dashboard/settings" className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            ⚙️ 系統設定
          </a>
        </nav>
      </aside>

      {/* 主要內容區域 */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
