
import React, { useState, useRef, useEffect } from 'react';
import { AppendixType, GenerationConfig } from './types';
import { GDPT_2018_SUBJECTS, DEMO_DATA, DEPARTMENTS, ACADEMIC_YEARS, INTEGRATION_TOPICS, TEXTBOOK_SERIES } from './constants';
import { generateAppendix } from './services/geminiService';

declare const mammoth: any;
declare const pdfjsLib: any;
declare const MathJax: any;

const App: React.FC = () => {
  const [config, setConfig] = useState<GenerationConfig>({
    appendixType: AppendixType.PHU_LUC_III,
    inputData: '',
    gradeLevel: 'Khối 6 (Mức TC1)',
    schoolName: '',
    departmentName: DEPARTMENTS[0],
    teacherName: '',
    subjectName: 'Tin học',
    academicYear: ACADEMIC_YEARS[0],
    selectedIntegrations: ['NLS'],
    textbookSeries: TEXTBOOK_SERIES[0]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (generatedHtml && typeof MathJax !== 'undefined') {
      const timer = setTimeout(() => {
        MathJax.typesetPromise().catch(() => {});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [generatedHtml]);

  const toggleIntegration = (key: string) => {
    setConfig(prev => {
      const current = prev.selectedIntegrations;
      if (current.includes(key)) {
        return { ...prev, selectedIntegrations: current.filter(k => k !== key) };
      } else {
        return { ...prev, selectedIntegrations: [...current, key] };
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsFileProcessing(true);
    setError(null);
    try {
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setConfig(prev => ({ ...prev, inputData: result.value }));
      } else if (file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }
        setConfig(prev => ({ ...prev, inputData: fullText }));
      } else {
        const text = await file.text();
        setConfig(prev => ({ ...prev, inputData: text }));
      }
    } catch (err) {
      setError("Không thể đọc tệp. Vui lòng kiểm tra định dạng .doc, .docx hoặc .pdf.");
    } finally {
      setIsFileProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!config.inputData.trim()) {
      setError("Vui lòng tải lên hoặc nhập nội dung bài dạy.");
      return;
    }
    if (config.selectedIntegrations.length === 0) {
      setError("Vui lòng chọn ít nhất một hình thức tích hợp.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedHtml('');
    try {
      await generateAppendix(config, (updatedText) => {
        setGeneratedHtml(updatedText);
      });
    } catch (err: any) {
      setError(err.message || "Lỗi xử lý hệ thống AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToWord = () => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head><meta charset='utf-8'><title>Appendix Export</title>
                    <style>
                      body { font-family: "Times New Roman", serif; font-size: 11pt; line-height: 1.25; padding: 2cm; }
                      table { border-collapse: collapse; width: 100%; border: 1px solid black; margin-bottom: 20px; }
                      th, td { border: 1px solid black; padding: 8px; vertical-align: top; }
                      th { background-color: #f1f5f9; font-weight: bold; text-align: center; font-size: 10pt; }
                      h1, h2, h3 { text-align: center; text-transform: uppercase; font-weight: bold; }
                    </style>
                    </head><body>`;
    const footer = "</body></html>";
    const content = document.querySelector('.document-preview-container')?.innerHTML || generatedHtml;
    const blob = new Blob(['\ufeff', header + content + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.appendixType}_${config.gradeLevel.replace(/\s/g, '_')}.doc`;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-['Inter']">
      <div className="bg-slate-900 text-slate-400 text-[10px] font-bold py-2.5 px-6 no-print uppercase tracking-[0.2em] flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>Matrix DocAnalyzer Pro v5.3 - Professional Administrative AI</span>
        </div>
        <span>TRẦN THỊ NGỌC - THCS THANH LUÔNG</span>
      </div>

      <header className="bg-white shadow-sm no-print border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-100">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Trợ lý Biên tập Phụ lục 5512</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Tự động điền nội dung tích hợp chuẩn hành chính sư phạm</p>
            </div>
          </div>
          <div className="flex bg-slate-100 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
            <button 
              onClick={() => setConfig(prev => ({ ...prev, appendixType: AppendixType.PHU_LUC_I }))}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black transition-all ${config.appendixType === AppendixType.PHU_LUC_I ? 'bg-white text-indigo-600 shadow-lg border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
            >
              PHỤ LỤC I (Tổ trưởng)
            </button>
            <button 
              onClick={() => setConfig(prev => ({ ...prev, appendixType: AppendixType.PHU_LUC_III }))}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black transition-all ${config.appendixType === AppendixType.PHU_LUC_III ? 'bg-white text-indigo-600 shadow-lg border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
            >
              PHỤ LỤC III (Giáo viên)
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-[1920px] mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-[460px] space-y-6 no-print flex-shrink-0">
          <div className="bg-white p-7 rounded-[32px] shadow-sm border border-slate-200 space-y-6">
            <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              Cấu hình tích hợp
            </h2>
            
            <div className="space-y-2.5">
              {Object.entries(INTEGRATION_TOPICS).map(([key, topic]) => (
                <label key={key} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${config.selectedIntegrations.includes(key) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100'}`}>
                  <input 
                    type="checkbox" 
                    checked={config.selectedIntegrations.includes(key)}
                    onChange={() => toggleIntegration(key)}
                    className="mt-1 w-5 h-5 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{topic.label}</div>
                    <div className="text-[9px] text-slate-500 leading-tight mt-0.5 font-medium">{topic.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Thông tin chung</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Môn học</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 cursor-pointer"
                    value={config.subjectName}
                    onChange={e => setConfig(prev => ({ ...prev, subjectName: e.target.value }))}
                  >
                    {GDPT_2018_SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Khối lớp</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 cursor-pointer"
                    value={config.gradeLevel}
                    onChange={e => setConfig(prev => ({ ...prev, gradeLevel: e.target.value }))}
                  >
                    <option>Khối 6 (Mức TC1)</option>
                    <option>Khối 7 (Mức TC1)</option>
                    <option>Khối 8 (Mức TC2)</option>
                    <option>Khối 9 (Mức TC2)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Bộ sách</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 cursor-pointer"
                    value={config.textbookSeries}
                    onChange={e => setConfig(prev => ({ ...prev, textbookSeries: e.target.value }))}
                  >
                    {TEXTBOOK_SERIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Năm học</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 cursor-pointer"
                    value={config.academicYear}
                    onChange={e => setConfig(prev => ({ ...prev, academicYear: e.target.value }))}
                  >
                    {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung bài dạy (Tài liệu nguồn)</label>
                <div className="flex gap-2 mb-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-grow py-3 px-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    Tải file (.DOCX/PDF)
                  </button>
                  <button 
                    onClick={() => setConfig(prev => ({ ...prev, inputData: DEMO_DATA }))}
                    className="py-3 px-6 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
                  >
                    Mẫu
                  </button>
                </div>
                <textarea 
                  className="w-full px-5 py-4 rounded-[24px] border border-slate-200 text-[11px] min-h-[140px] focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 resize-none font-medium leading-relaxed"
                  placeholder="Dán nội dung phân phối chương trình hoặc mục tiêu bài học tại đây..."
                  value={config.inputData}
                  onChange={e => setConfig(prev => ({ ...prev, inputData: e.target.value }))}
                />
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".docx,.doc,.pdf,.txt" />
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading || isFileProcessing}
              className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black text-[12px] uppercase tracking-[0.1em] shadow-xl shadow-indigo-200/50 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none active:scale-95"
            >
              {isLoading ? 'Hệ thống AI đang thực thi...' : 'Biên soạn nội dung tích hợp'}
            </button>
            {error && <div className="mt-4 p-4 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-black text-center uppercase tracking-tight">{error}</div>}
          </div>
        </aside>

        <section className="flex-grow bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[85vh]">
          <div className="px-10 py-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 no-print">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Compliance Editor V5.3</span>
            </div>
            {generatedHtml && (
              <div className="flex gap-3">
                <button 
                  onClick={exportToWord}
                  className="bg-white px-7 py-3 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                  Xuất file Word
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-900 text-white px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  In hồ sơ
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-grow p-12 lg:p-16 overflow-auto bg-slate-100/30">
            <div className="document-preview-container bg-white shadow-2xl mx-auto max-w-[900px] min-h-[1200px] p-[2.5cm] border border-slate-200 transition-all">
              {!generatedHtml && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center py-40 space-y-8 opacity-40">
                  <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center border-2 border-dashed border-slate-200">
                    <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-black uppercase text-sm tracking-[0.2em]">Hệ thống đang chờ lệnh</h3>
                    <p className="text-slate-500 text-[10px] mt-3 max-w-[320px] font-bold uppercase tracking-widest">Tải lên hoặc dán nội dung bài dạy để bắt đầu biên tập phụ lục chuẩn 5512.</p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="space-y-8 p-10">
                  <div className="h-4 bg-slate-100 rounded-full w-2/3 mx-auto animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded-full w-1/3 mx-auto animate-pulse"></div>
                  <div className="space-y-4 mt-16">
                    <div className="h-3 bg-slate-50 rounded-full w-full animate-pulse"></div>
                    <div className="h-3 bg-slate-50 rounded-full w-11/12 animate-pulse"></div>
                    <div className="h-[400px] bg-slate-50 rounded-[32px] w-full mt-8 border-2 border-dashed border-slate-100 animate-pulse"></div>
                  </div>
                </div>
              )}

              {generatedHtml && (
                <div 
                  className="prose prose-slate max-w-none text-[11pt] leading-normal font-['Times_New_Roman']
                  [&_table]:w-full [&_table]:border-collapse [&_table]:my-8 [&_table]:border-black
                  [&_th]:border [&_th]:border-black [&_th]:p-3 [&_th]:bg-slate-50 [&_th]:text-center [&_th]:font-bold [&_th]:uppercase [&_th]:text-[10pt]
                  [&_td]:border [&_td]:border-black [&_td]:p-4 [&_td]:align-top [&_td]:leading-relaxed
                  [&_h1]:text-center [&_h1]:uppercase [&_h1]:text-[14pt] [&_h1]:mb-6 [&_h1]:font-bold
                  [&_h2]:uppercase [&_h2]:text-[12pt] [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-bold [&_h2]:text-center
                  [&_p]:text-[11pt] [&_p]:mb-4 [&_p]:text-justify"
                  dangerouslySetInnerHTML={{ __html: generatedHtml }}
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
