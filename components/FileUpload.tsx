import React, { useState, useCallback } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate file processing
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onUploadComplete();
    }, 1500); // 1.5s simulated delay
  }, [onUploadComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">စာရင်းသွင်းရန်</h2>
          <p className="text-slate-500">Excel (သို့) CSV ဖိုင်ကို ဤနေရာတွင် ထည့်သွင်းပါ။</p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 p-10
            flex flex-col items-center justify-center text-center
            min-h-[300px] bg-white
            ${isDragging 
              ? 'border-emerald-500 bg-emerald-50 scale-[1.02] shadow-xl' 
              : 'border-slate-200 shadow-sm hover:border-slate-300'
            }
          `}
        >
          {isProcessing ? (
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <FileSpreadsheet className="text-emerald-600 animate-bounce" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-emerald-700">အချက်အလက်များကို စစ်ဆေးနေပါသည်...</h3>
              <p className="text-sm text-emerald-600/70 mt-2">ခေတ္တစောင့်ဆိုင်းပေးပါ။</p>
            </div>
          ) : (
            <>
              <div className={`
                w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors
                ${isDragging ? 'bg-emerald-100' : 'bg-slate-100'}
              `}>
                <UploadCloud 
                  size={40} 
                  className={isDragging ? 'text-emerald-600' : 'text-slate-400'} 
                />
              </div>
              
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                {isDragging ? 'ဖိုင်ကို လွှတ်ချလိုက်ပါ' : 'ဖိုင်ဆွဲထည့်ပါ (သို့) နှိပ်ပါ'}
              </h3>
              
              <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
                သင့်လုပ်ငန်း၏ ဝင်ငွေ/ထွက်ငွေ စာရင်းများကို အလိုအလျောက် တွက်ချက်ပေးပါမည်။
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <AlertCircle size={14} />
                <span>Supported formats: .xlsx, .csv</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;