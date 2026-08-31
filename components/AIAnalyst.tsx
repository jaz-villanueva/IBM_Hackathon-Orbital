'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AIMessage, AIContext } from '@/lib/types';
import { Send, X, ChevronDown, Sparkles, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface AIAnalystProps {
  context: AIContext;
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  default: [
    "What is happening in space right now?",
    "What data sources does ORBITAL use?",
    "Which missions are studying Mars?",
    "What's the difference between observed and derived data?",
  ],
  earth: [
    "What missions are monitoring Earth's climate?",
    "Tell me about the ISS crew",
    "How many Earth observation satellites are active?",
  ],
  moon: [
    "What missions are currently orbiting the Moon?",
    "What is Artemis II doing and when does it launch?",
    "What did LRO discover about the Moon?",
  ],
  mars: [
    "What are the Mars rovers doing right now?",
    "What has Perseverance discovered?",
    "Why does Mars have so many orbiters?",
    "Explain the Mars methane mystery",
  ],
};

function renderMarkdown(text: string) {
  return text
    .split('\n\n')
    .map((para, i) => {
      if (para.startsWith('**') && para.endsWith('**')) {
        return <h3 key={i} className="text-orbit-white font-semibold text-sm mt-3 mb-1">{para.replace(/\*\*/g, '')}</h3>;
      }
      const formatted = para
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orbit-white">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^• (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/<\/li><li/g, '</li><li')
        .replace(/(<li[\s\S]*<\/li>)/, '<ul class="space-y-0.5">$1</ul>');
      return <p key={i} className="text-[13px] text-orbit-dim leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
}

export function AIAnalyst({ context, isOpen, onClose }: AIAnalystProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const planet = context.selectedPlanet || '';
  const suggestions = SUGGESTED_QUESTIONS[planet] || SUGGESTED_QUESTIONS.default;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          missionId: context.selectedMission?.id,
          planet: context.selectedPlanet,
          riskContext: context.selectedRisk,
          satelliteId: context.selectedSatellite?.noradId,
        }),
      });
      const data = await res.json();
      const assistantMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content || 'Unable to generate response.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Connection error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, context]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={clsx(
      'fixed bottom-4 right-4 z-40 glass rounded-xl border border-space-border shadow-2xl transition-all duration-300',
      minimized ? 'w-64 h-12' : 'w-80 md:w-96 h-[520px]',
      'flex flex-col'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-space-border shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sparkles size={13} className="text-purple-400 shrink-0" />
          <div>
            <div className="text-[11px] font-semibold text-orbit-white tracking-widest">AI SPACE ANALYST</div>
            {!minimized && (context.selectedRisk
              ? <div className="text-[9px] text-purple-300/70 mt-0.5 truncate">
                  Risk: {context.selectedRisk.objectAName} ↔ {context.selectedRisk.objectBName}
                </div>
              : context.selectedSatellite
              ? <div className="text-[9px] text-purple-300/70 mt-0.5 truncate">
                  Satellite: {context.selectedSatellite.name}
                </div>
              : context.selectedMission && (
                <div className="text-[9px] text-orbit-dim mt-0.5 truncate">
                  Context: {context.selectedMission.name}
                </div>
              )
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <button onClick={() => setMinimized(!minimized)} className="p-1 text-orbit-dim hover:text-orbit-white">
            <ChevronDown size={14} className={clsx('transition-transform', minimized && 'rotate-180')} />
          </button>
          <button onClick={onClose} className="p-1 text-orbit-dim hover:text-orbit-white">
            <X size={14} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                {/* Welcome */}
                <div className="text-[11px] text-orbit-dim/70 text-center py-2 leading-relaxed">
                  Ask me about any mission in the atlas. I answer using publicly available data only.
                </div>
                {/* AI label warning */}
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-purple-400/5 border border-purple-400/20">
                  <Sparkles size={11} className="text-purple-400 mt-0.5 shrink-0" />
                  <div className="text-[10px] text-purple-300/80">
                    All responses are AI-generated based on curated public mission data. I do not fabricate telemetry.
                  </div>
                </div>

                {/* Suggested questions */}
                <div className="space-y-1.5">
                  <div className="text-[9px] text-orbit-dim tracking-widest">SUGGESTED QUESTIONS</div>
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-[11px] text-orbit-dim hover:text-orbit-white px-3 py-2 rounded glass-subtle hover:bg-white/5 transition-colors leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={clsx(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-[90%] rounded-lg px-3 py-2',
                        msg.role === 'user'
                          ? 'bg-orbit-blue/20 border border-orbit-blue/30 text-orbit-white text-[13px]'
                          : 'glass-subtle border border-space-border'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-[13px] leading-relaxed">{msg.content}</p>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-space-border/50">
                            <Sparkles size={9} className="text-purple-400" />
                            <span className="text-[9px] text-purple-400/80 tracking-widest">AI GENERATED</span>
                          </div>
                          <div className="prose-space">{renderMarkdown(msg.content)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="glass-subtle border border-space-border rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <RefreshCw size={11} className="text-orbit-dim animate-spin" />
                        <span className="text-[11px] text-orbit-dim">Analyzing mission data...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-space-border shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any mission..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-space-deep border border-space-border rounded-lg px-3 py-2 text-[13px] text-orbit-white placeholder-orbit-dim/40 outline-none focus:border-orbit-blue/50 resize-none overflow-hidden leading-relaxed"
                style={{ minHeight: '38px', maxHeight: '96px' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 96) + 'px';
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-lg bg-orbit-blue/20 border border-orbit-blue/30 text-orbit-blue hover:bg-orbit-blue/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
            <div className="mt-1.5 text-[9px] text-orbit-dim/40 text-center tracking-wider">
              POWERED BY AI · DATA FROM NASA, ESA, CELESTRAK
            </div>
          </div>
        </>
      )}
    </div>
  );
}
