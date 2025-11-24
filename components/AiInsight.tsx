import React, { useEffect, useState } from 'react';
import { Sparkles, Lightbulb, Bot, Loader2, AlertCircle, Clock } from 'lucide-react';
import OpenAI from 'openai';

interface AiInsightProps {
  data: any[];
  lang: 'en' | 'my';
  currency: 'MMK' | 'USD';
  summary?: any;
  apiKey: string;
}

const AiInsight: React.FC<AiInsightProps> = ({ data, lang, currency, summary, apiKey }) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const generateInsight = async () => {
      // Only analyze if we have data and a key
      if (!data || data.length === 0 || !apiKey) return;

      // Strict check for OpenAI Key format
      if (!apiKey.startsWith('sk-')) {
          console.error("Invalid API Key format passed to AiInsight");
          setAuthError(true);
          return;
      }
      
      setLoading(true);
      setError(false);
      setQuotaError(false);
      setAuthError(false);
      
      try {
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

        // Summarize data to minimize token usage
        const recentData = data.slice(-6).map(d => ({
            Month: d.month,
            Rev: d.revenue,
            Exp: d.expenses,
            Profit: d.netProfit
        }));

        const prompt = `
          As a senior financial analyst, analyze this financial data (Currency: ${currency}).

          OVERALL SUMMARY (Whole Dataset):
          ${JSON.stringify(summary || {})}

          RECENT TRENDS (Last 6 months):
          ${JSON.stringify(recentData)}
          
          Identify 3 critical trends, anomalies, or actionable areas for improvement.
          
          Output Rules:
          1. Language: ${lang === 'my' ? 'Burmese (Myanmar Language)' : 'English'}.
          2. Format: Return exactly 3 concise bullet points separated by newlines.
          3. Tone: Professional, encouraging, and insightful.
          4. Do not include introductory text.
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: "You are a helpful financial analyst." },
                { role: "user", content: prompt }
            ]
        });

        const text = response.choices[0].message.content || "";
        
        // Split by newline and clean up bullets
        const points = text
          .split('\n')
          .map(line => line.replace(/^[-*•\d.]+\s*/, '').trim())
          .filter(line => line.length > 0);
          
        setInsights(points.slice(0, 3)); 
      } catch (err: any) {
        console.error("AI Insight Error:", err);
        // OpenAI error handling
        if (err.status === 429) {
            setQuotaError(true);
        } else if (err.status === 401) {
            setAuthError(true);
        } else {
            setError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    generateInsight();
  }, [data, lang, currency, summary, apiKey]);

  const title = lang === 'en' ? "AI Financial Analysis" : "Shwe AI သုံးသပ်ချက်";
  const subTitle = lang === 'en' ? "Real-time Insights" : "လက်ရှိစာရင်းများအပေါ် အခြေခံထားသည်";
  const errorMessage = lang === 'en' ? "Unable to generate insights." : "သုံးသပ်ချက် ရယူ၍မရပါ";

  return (
    <div className="relative group h-full">
      {/* Animated Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
      
      {/* Card Content */}
      <div className="relative h-full bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col transition-all duration-300 hover:translate-y-[-2px]">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500 blur-md opacity-20 rounded-full"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
               {loading ? <Loader2 size={22} className="text-white animate-spin" /> : <Bot size={22} className="text-white" />}
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-100 text-lg leading-tight font-padauk">{title}</h3>
            <p className="text-xs text-cyan-400 font-medium font-padauk">{subTitle}</p>
          </div>

          <div className="ml-auto">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-1.5 rounded-full uppercase tracking-wider border border-cyan-500/20">
              <Sparkles size={10} />
              Smart Analysis
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-3 bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3 text-slate-500">
               <Loader2 className="animate-spin text-cyan-500" size={24} />
               <span className="text-xs font-padauk">Analyzing data...</span>
            </div>
          ) : quotaError ? (
             <div className="flex flex-col items-center justify-center h-32 gap-2 text-amber-500 p-4 text-center">
                <Clock size={24} className="mb-1 opacity-80" />
                <span className="text-sm font-bold font-padauk">Quota Exceeded</span>
                <p className="text-[10px] text-slate-400 leading-relaxed">Check your Plan<br/>or API limits.</p>
             </div>
          ) : authError ? (
             <div className="flex flex-col items-center justify-center h-32 gap-2 text-rose-500 p-4 text-center">
                <AlertCircle size={24} className="mb-1 opacity-80" />
                <span className="text-sm font-bold font-padauk">Incorrect API Key</span>
                <p className="text-[10px] text-slate-400 leading-relaxed">Please ensure you are using<br/>a valid OpenAI Key.</p>
             </div>
          ) : error ? (
             <div className="flex items-center justify-center h-32 gap-2 text-rose-400">
                <AlertCircle size={20} />
                <span className="text-sm font-padauk">{errorMessage}</span>
             </div>
          ) : (
            insights.map((line, index) => (
              <div key={index} className="flex items-start gap-3 text-slate-300 leading-relaxed group/item hover:bg-slate-800/50 p-2 rounded-lg transition-all duration-200">
                 <div className="mt-0.5 p-1.5 bg-amber-500/10 rounded-full flex-shrink-0 group-hover/item:bg-amber-500/20 transition-colors">
                     <Lightbulb size={12} className="text-amber-500" />
                 </div>
                 <p className="text-sm font-medium font-padauk">{line}</p>
              </div>
            ))
          )}
          {!loading && !error && !quotaError && !authError && insights.length === 0 && (
             <div className="text-center text-slate-500 text-sm py-4">No data available for analysis.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiInsight;