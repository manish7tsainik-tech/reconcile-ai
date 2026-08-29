'use client';

import { useState, useEffect, useRef } from 'react';
import { Brain, Send, Sparkles, AlertTriangle, TrendingUp, DollarSign, Search as SearchIcon } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { AiInsight } from '@/lib/types';

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string; records?: unknown[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/ai')
      .then(r => r.json())
      .then(data => { setInsights(data.insights || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const sendQuery = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: q }]);
    setChatLoading(true);
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer, records: data.records }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    }
    setChatLoading(false);
  };

  const SEVERITY_COLORS: Record<string, string> = {
    high: 'border-l-red-500 bg-red-50',
    medium: 'border-l-amber-500 bg-amber-50',
    low: 'border-l-blue-500 bg-blue-50',
  };

  const SEVERITY_BADGE: Record<string, string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
        <p className="text-sm text-gray-500">Intelligent analysis of your financial data</p>
      </div>

      {/* AI Chat */}
      <Card title="ReconcileAI Agent" subtitle="Ask questions about your financial data">
        <div className="h-80 overflow-y-auto space-y-3 mb-4 p-2">
          {chatMessages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              <div className="text-center">
                <Brain className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>Ask me anything about your financial data</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {['Show unmatched invoices', 'Find duplicate payments', 'What is my reconciliation rate?', 'Which invoices are overdue?'].map(q => (
                    <button key={q} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600 transition-colors" onClick={() => { setChatInput(q); }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <p className="text-sm">{msg.content}</p>
                {msg.records && msg.records.length > 0 && (
                  <div className="mt-2 text-xs opacity-80">
                    <p>{msg.records.length} records found</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about invoices, payments, reconciliation..." onKeyDown={(e) => e.key === 'Enter' && sendQuery()} />
          <Button variant="primary" icon={<Send className="w-4 h-4" />} onClick={sendQuery} loading={chatLoading}>Send</Button>
        </div>
      </Card>

      {/* Insights */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Data Insights
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : insights.length === 0 ? (
          <Card><p className="text-center text-gray-500 py-8">No insights available. Run reconciliation first.</p></Card>
        ) : (
          <div className="space-y-3">
            {insights.map((insight: AiInsight) => (
              <Card key={insight.id}>
                <div className={`border-l-4 p-4 rounded-r-lg ${SEVERITY_COLORS[insight.severity] || 'border-l-gray-300 bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_BADGE[insight.severity] || ''}`}>{insight.severity}</span>
                        <h3 className="font-medium text-gray-900">{insight.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{insight.evidence}</p>
                      <p className="text-sm text-gray-500 mt-1"><span className="font-medium">Impact:</span> {insight.impact}</p>
                      <p className="text-sm text-indigo-600 mt-2"><span className="font-medium">Recommended:</span> {insight.recommended_action}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
