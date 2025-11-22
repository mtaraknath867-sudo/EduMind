
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import InputArea from './components/InputArea';
import MessageBubble from './components/MessageBubble';
import { generateAnswerStream, generateQuizFromText } from './services/geminiService';
import { Message, Subject, View, Bookmark, QuizQuestion, ThemeColor } from './types';
import { LANGUAGES, THEME_COLORS } from './constants';
import { Menu, Sun, Moon, Trash2, Loader2, History, Languages, Settings, Mail, HelpCircle, AlertTriangle, ChevronRight, ExternalLink, ChevronDown, ChevronUp, Info, Palette, Upload, ImageMinus, Image as ImageIcon, FileText, FileDown, Plus } from 'lucide-react';
import AdBanner from './components/AdBanner';

function App() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [view, setView] = useState<View>('chat');
  const [darkMode, setDarkMode] = useState(false);
  const [themeColor, setThemeColor] = useState<ThemeColor>('red');
  const [language, setLanguage] = useState('English');
  const [customBg, setCustomBg] = useState<string | null>(null);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "# Namaste! 🙏\nI'm **EduMind**, your personal AI tutor.\n\n**Powered by Google Gemini 3 Pro** 🚀\n\nAsk me about Madhyamik, HS, JEE, or upload a doubt!",
      timestamp: Date.now(),
      subject: 'General'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject>('General');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Bookmark State
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<{[key: number]: string}>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Image to PDF State
  const [pdfImages, setPdfImages] = useState<string[]>([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // UI State
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Theme Effect (Dark Mode)
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Theme Effect (Color Palette)
  useEffect(() => {
    const root = document.documentElement;
    const colors = THEME_COLORS[themeColor].colors;
    
    root.style.setProperty('--brand-50', colors[50]);
    root.style.setProperty('--brand-100', colors[100]);
    root.style.setProperty('--brand-500', colors[500]);
    root.style.setProperty('--brand-600', colors[600]);
    root.style.setProperty('--brand-700', colors[700]);
    
    // Save preference
    localStorage.setItem('edumind-theme-color', themeColor);
  }, [themeColor]);

  // Load Saved Preferences
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('edumind-bookmarks');
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

    const savedTheme = localStorage.getItem('edumind-theme-color') as ThemeColor;
    if (savedTheme && THEME_COLORS[savedTheme]) setThemeColor(savedTheme);

    const savedBg = localStorage.getItem('edumind-custom-bg');
    if (savedBg) setCustomBg(savedBg);
  }, []);

  // LocalStorage Save Bookmarks
  useEffect(() => {
    localStorage.setItem('edumind-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Save Custom Background
  useEffect(() => {
      if (customBg) {
          try {
              localStorage.setItem('edumind-custom-bg', customBg);
          } catch (e) {
              console.error("Image too large for local storage");
              // Ideally warn user, but for now just fail silently or handle gracefully
          }
      } else {
          localStorage.removeItem('edumind-custom-bg');
      }
  }, [customBg]);


  const handleSend = async (text: string, subject: Subject, images: string[]) => {
    if (isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
      images,
      subject
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: botMsgId,
      role: 'model',
      text: '', // Starts empty for streaming
      timestamp: Date.now(),
      subject
    }]);

    try {
        await generateAnswerStream(text, subject, language, images, (chunk) => {
            setMessages(prev => prev.map(msg => 
                msg.id === botMsgId ? { ...msg, text: chunk } : msg
            ));
        });
    } catch (error) {
        setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { ...msg, text: "Sorry, I encountered an error processing your request. Please try again.", isError: true } : msg
        ));
    } finally {
        setIsTyping(false);
    }
  };

  const handleBookmark = (text: string) => {
    const newBookmark: Bookmark = {
        id: Date.now().toString(),
        content: text,
        timestamp: Date.now(),
        tags: [selectedSubject]
    };
    setBookmarks(prev => [newBookmark, ...prev]);
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const handleNewChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: "Start a new topic! What's on your mind?",
      timestamp: Date.now(),
      subject: 'General'
    }]);
    setView('chat');
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Limit size to prevent localStorage crash (approx 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert("Please upload an image smaller than 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setCustomBg(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handlePdfImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          const filePromises = Array.from(files).map((file: File) => {
              return new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
              });
          });
          const loadedImages = await Promise.all(filePromises);
          setPdfImages(prev => [...prev, ...loadedImages]);
      }
      if (e.target) e.target.value = '';
  };

  const handleRemovePdfImage = (index: number) => {
      setPdfImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadPdf = () => {
      const element = document.getElementById('pdf-preview-container');
      if (!element) return;

      if (typeof window !== 'undefined' && (window as any).html2pdf) {
          const opt = {
              margin: [10, 10, 10, 10],
              filename: `edumind-scan-${Date.now()}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          (window as any).html2pdf().set(opt).from(element).save();
      } else {
          alert("PDF Generator is initializing. Please try again in a moment.");
      }
  };

  const generateQuiz = async () => {
    // Get the last model message context
    const lastModelMsg = [...messages].reverse().find(m => m.role === 'model' && !m.isError);
    if (!lastModelMsg) return;

    setQuizLoading(true);
    setSelectedQuizAnswers({});
    setShowQuizResults(false);
    
    const questions = await generateQuizFromText(lastModelMsg.text);
    setQuizQuestions(questions);
    setQuizLoading(false);
  };

  // View Components
  const ChatView = () => (
    <div className="flex flex-col h-full relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 scroll-smooth">
            <div className="max-w-3xl mx-auto">
                <AdBanner />
                {messages.map(msg => (
                    <MessageBubble 
                        key={msg.id} 
                        message={msg} 
                        onBookmark={handleBookmark}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 no-print bg-gradient-to-t from-slate-50/90 via-slate-50/50 to-transparent dark:from-slate-950/90 dark:via-slate-950/50 pointer-events-none">
            <div className="pointer-events-auto">
                <InputArea 
                    onSend={handleSend} 
                    isLoading={isTyping} 
                    selectedSubject={selectedSubject}
                    onSubjectChange={setSelectedSubject}
                    language={language}
                    onLanguageChange={setLanguage}
                />
            </div>
        </div>
    </div>
  );

  const BookmarksView = () => (
      <div className="p-6 max-w-4xl mx-auto overflow-y-auto h-full">
          <AdBanner />
          <h2 className="text-2xl font-bold mb-6 dark:text-white bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-2 rounded-lg inline-block">Saved Notes</h2>
          {bookmarks.length === 0 ? (
              <div className="text-center text-slate-400 mt-20 bg-white/50 dark:bg-slate-900/50 p-8 rounded-2xl">No saved notes yet.</div>
          ) : (
              <div className="grid gap-4">
                  {bookmarks.map(b => (
                      <div key={b.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative group">
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleDeleteBookmark(b.id)} className="text-red-400 hover:text-red-600">
                                  <Trash2 size={18} />
                              </button>
                          </div>
                          <div className="text-xs font-bold text-brand-600 mb-2 uppercase tracking-wider">{b.tags[0]}</div>
                          <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-4 mb-2">
                              {/* Truncate for preview */}
                              {b.content.substring(0, 300)}...
                          </div>
                          <div className="text-xs text-slate-400 mt-2">
                              {new Date(b.timestamp).toLocaleDateString()}
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
  );

  const QuizView = () => (
    <div className="p-6 max-w-3xl mx-auto h-full overflow-y-auto">
        <AdBanner />
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl mb-6 border border-gray-100 dark:border-slate-800">
            <h2 className="text-2xl font-bold mb-2 dark:text-white">AI Quiz Generator</h2>
            <p className="text-slate-500">Test your knowledge based on your recent conversation.</p>
        </div>

        {!quizQuestions.length && !quizLoading && (
            <div className="text-center mt-20 bg-white/50 dark:bg-slate-900/50 p-8 rounded-2xl">
                <p className="mb-4 text-slate-600 dark:text-slate-300">Go back to chat, ask a question, and then come here to generate a quiz based on the answer!</p>
                <button 
                    onClick={generateQuiz}
                    className="bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700 transition"
                >
                    Generate Quiz from Last Answer
                </button>
            </div>
        )}

        {quizLoading && (
            <div className="flex flex-col items-center justify-center mt-20 text-slate-500">
                <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
                <p className="bg-white/50 dark:bg-slate-900/50 px-4 py-2 rounded-lg">Creating custom questions for you...</p>
            </div>
        )}

        {quizQuestions.length > 0 && !quizLoading && (
            <div className="space-y-8 pb-20">
                {quizQuestions.map((q, qIdx) => {
                    const isCorrect = selectedQuizAnswers[qIdx] === q.correctAnswer;
                    const isAnswered = selectedQuizAnswers[qIdx] !== undefined;
                    
                    return (
                        <div key={qIdx} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-lg font-semibold mb-4 dark:text-white">{qIdx + 1}. {q.question}</h3>
                            <div className="space-y-2">
                                {q.options.map((opt) => {
                                    let btnClass = "w-full text-left p-3 rounded-lg border transition-all ";
                                    if (showQuizResults) {
                                        if (opt === q.correctAnswer) btnClass += "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-200 ";
                                        else if (selectedQuizAnswers[qIdx] === opt) btnClass += "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-200 ";
                                        else btnClass += "border-gray-200 dark:border-slate-700 opacity-50 ";
                                    } else {
                                        if (selectedQuizAnswers[qIdx] === opt) btnClass += "bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200 ";
                                        else btnClass += "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 ";
                                    }

                                    return (
                                        <button 
                                            key={opt}
                                            onClick={() => !showQuizResults && setSelectedQuizAnswers(prev => ({...prev, [qIdx]: opt}))}
                                            className={btnClass}
                                            disabled={showQuizResults}
                                        >
                                            {opt}
                                        </button>
                                    )
                                })}
                            </div>
                            {showQuizResults && (
                                <div className={`mt-4 p-3 rounded-lg text-sm ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'} dark:bg-slate-700/50 dark:text-slate-300`}>
                                    <p className="font-bold mb-1">Explanation:</p>
                                    {q.explanation}
                                </div>
                            )}
                        </div>
                    )
                })}
                
                {!showQuizResults ? (
                     <button 
                        onClick={() => setShowQuizResults(true)}
                        className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-brand-700 transition"
                     >
                        Check Answers
                     </button>
                ) : (
                    <div className="flex gap-4">
                         <button 
                            onClick={() => {
                                setQuizQuestions([]);
                                setView('chat');
                            }}
                            className="flex-1 bg-gray-200 dark:bg-slate-700 text-slate-800 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-300 transition"
                         >
                            Back to Study
                         </button>
                          <button 
                            onClick={generateQuiz}
                            className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-brand-700 transition"
                         >
                            New Quiz
                         </button>
                    </div>
                )}
            </div>
        )}
    </div>
  );

  const ImageToPdfView = () => (
      <div className="p-6 max-w-3xl mx-auto h-full overflow-y-auto">
           <AdBanner />
           <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl mb-6 border border-gray-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold mb-1 dark:text-white flex items-center gap-2">
                        <FileText className="text-brand-600" />
                        Photo to PDF
                    </h2>
                    <p className="text-slate-500 text-sm">Scan notes, assignments, or books into a single PDF.</p>
                </div>
                {pdfImages.length > 0 && (
                    <button 
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-all"
                    >
                        <FileDown size={18} />
                        Download PDF
                    </button>
                )}
           </div>

           {pdfImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-12 bg-white/50 dark:bg-slate-900/50 p-12 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 transition-colors cursor-pointer" onClick={() => pdfInputRef.current?.click()}>
                    <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-full flex items-center justify-center mb-4">
                        <Upload size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Upload Photos</h3>
                    <p className="text-slate-500 text-center max-w-xs mb-6">Select multiple photos of your notes from your gallery.</p>
                    <button className="px-6 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                        Choose Files
                    </button>
                </div>
           ) : (
               <div className="space-y-6">
                   {/* Controls */}
                   <div className="flex gap-3 mb-4">
                        <button 
                            onClick={() => pdfInputRef.current?.click()}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm"
                        >
                            <Plus size={18} />
                            Add More Photos
                        </button>
                        <button 
                            onClick={() => setPdfImages([])}
                            className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                            title="Clear All"
                        >
                            <Trash2 size={18} />
                        </button>
                   </div>

                   {/* PDF Preview Container (Visible to user and used by html2pdf) */}
                   <div className="bg-gray-100 dark:bg-slate-900/50 p-8 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-inner">
                       <div 
                            id="pdf-preview-container" 
                            className="bg-white min-h-[800px] w-full max-w-[210mm] mx-auto shadow-2xl p-0" // A4 approximation
                       >
                            {pdfImages.map((img, idx) => (
                                <div key={idx} className="relative group border-b border-gray-100 last:border-0">
                                    {/* Image */}
                                    <img 
                                        src={img} 
                                        alt={`Page ${idx + 1}`} 
                                        className="w-full h-auto block"
                                    />
                                    
                                    {/* Overlay Controls (Hidden in Print/PDF) */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2" data-html2canvas-ignore="true">
                                        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            Page {idx + 1}
                                        </div>
                                        <button 
                                            onClick={() => handleRemovePdfImage(idx)}
                                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm"
                                            title="Remove Page"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                       </div>
                   </div>
               </div>
           )}
           
           <input 
                ref={pdfInputRef}
                type="file" 
                multiple 
                accept="image/*"
                className="hidden"
                onChange={handlePdfImageUpload}
            />
      </div>
  );

  const SettingsView = () => (
      <div className="p-6 max-w-2xl mx-auto h-full overflow-y-auto">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl mb-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-brand-600" />
                Settings
            </h2>
          </div>

          {/* Preferences Section */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1 bg-white/50 dark:bg-slate-900/50 inline-block px-2 py-1 rounded">Preferences</h3>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                
                {/* Language */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Languages size={18} />
                        </div>
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-white">Language / ভাষা</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">AI response language</p>
                        </div>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block w-full sm:w-40 p-2"
                    >
                      {LANGUAGES.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                </div>

                {/* Student Theme Selector */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                            <Palette size={18} />
                        </div>
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-white">Color Theme</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Accent colors</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {(Object.keys(THEME_COLORS) as ThemeColor[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => setThemeColor(color)}
                          title={THEME_COLORS[color].label}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${themeColor === color ? 'border-slate-400 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                        >
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ backgroundColor: `rgb(${THEME_COLORS[color].colors[500]})` }}
                          />
                        </button>
                      ))}
                    </div>
                </div>

                {/* Background Wallpaper */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-900/20 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400">
                                <ImageIcon size={18} />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">Background Wallpaper</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Set your own photo</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2">
                        {customBg ? (
                            <div className="flex items-center gap-3 w-full">
                                <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden flex-shrink-0 bg-gray-100">
                                    <img src={customBg} alt="Background" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => bgInputRef.current?.click()}
                                        className="px-3 py-2 text-sm bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition flex items-center gap-2"
                                    >
                                        <Upload size={14} /> Change
                                    </button>
                                    <button 
                                        onClick={() => setCustomBg(null)}
                                        className="px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center gap-2"
                                    >
                                        <ImageMinus size={14} /> Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => bgInputRef.current?.click()}
                                className="w-full h-16 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition"
                            >
                                <Upload size={18} />
                                <span className="text-sm font-medium">Upload Photo</span>
                            </button>
                        )}
                        <input 
                            ref={bgInputRef}
                            type="file" 
                            accept="image/*" 
                            className="hidden"
                            onChange={handleBgUpload}
                        />
                    </div>
                </div>

                {/* Dark Mode */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                        </div>
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-white">Appearance</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                        </div>
                    </div>
                     <button 
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-brand-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
          </div>

          {/* Help & Support Section */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1 bg-white/50 dark:bg-slate-900/50 inline-block px-2 py-1 rounded">Help & Support</h3>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                
                {/* FAQs */}
                <div>
                    <button 
                        onClick={() => setIsFaqOpen(!isFaqOpen)}
                        className="w-full p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <HelpCircle size={18} />
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white">FAQs</span>
                        </div>
                        {isFaqOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </button>
                    
                    {isFaqOpen && (
                        <div className="bg-gray-50/50 dark:bg-slate-800/50 p-4 border-b border-gray-200 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-2 duration-200">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">What is EduMind?</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">EduMind is a personal AI tutor designed for Indian students, specializing in WBBSE, WBCHSE, and JEE curriculums.</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">How do I save notes?</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Click the bookmark icon next to any AI response to save it to your 'Saved Notes' section.</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Can it solve math problems?</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Yes! You can type the problem or upload a photo of it. The AI will provide step-by-step solutions using the Substitution Method.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contact Support */}
                <a href="mailto:mtaraknath867@gmail.com?subject=EduMind%20Support%20Request" className="w-full p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition text-left group">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                            <Mail size={18} />
                        </div>
                        <div>
                            <span className="font-medium text-slate-900 dark:text-white block">Contact Support</span>
                            <span className="text-xs text-slate-500">mtaraknath867@gmail.com</span>
                        </div>
                    </div>
                    <ExternalLink size={16} className="text-slate-300 group-hover:text-slate-500" />
                </a>

                 {/* Report Problem */}
                <a href="mailto:mtaraknath867@gmail.com?subject=EduMind%20Problem%20Report" className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition text-left group">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <AlertTriangle size={18} />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">Report a Problem</span>
                    </div>
                    <ExternalLink size={16} className="text-slate-300 group-hover:text-slate-500" />
                </a>
            </div>
          </div>

          {/* About Section */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1 bg-white/50 dark:bg-slate-900/50 inline-block px-2 py-1 rounded">About</h3>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                 <div className="p-5 flex items-start gap-4">
                      <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0">
                          <div className="font-bold text-xl">E</div>
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">EduMind AI</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Version 1.2.0</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                              Designed to democratize education for students in West Bengal. Powered by Google's advanced Gemini models to provide accurate, localized, and high-quality academic assistance.
                          </p>
                      </div>
                 </div>
            </div>
          </div>

           <div className="text-center pb-6">
             <p className="text-xs text-slate-400">© 2024 EduMind AI.</p>
           </div>
      </div>
  );

  const HistoryView = () => (
      <div className="flex items-center justify-center h-full text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm m-4 rounded-2xl">
          <div className="text-center">
            <History size={48} className="mx-auto mb-4 opacity-50" />
            <p>Session history is not persisted in this demo.</p>
            <p className="text-sm">Only bookmarks are saved.</p>
          </div>
      </div>
  )

  // Helper to determine header title
  const getHeaderTitle = () => {
      switch(view) {
          case 'chat': return 'Study Session';
          case 'bookmarks': return 'Saved Notes';
          case 'quiz': return 'Quiz Me';
          case 'imageToPdf': return 'Photo to PDF';
          case 'settings': return 'Settings';
          case 'history': return 'History';
          default: return 'EduMind';
      }
  };

  return (
    <div 
        className="flex h-screen bg-grid transition-all duration-300 bg-cover bg-center"
        style={{ 
            backgroundImage: customBg ? `url(${customBg})` : undefined,
        }}
    >
      {/* Overlay for better readability if custom BG is active */}
      {customBg && <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-[2px] z-0 pointer-events-none"></div>}

      <div className="relative z-10 flex w-full h-full">
          <Sidebar 
            currentView={view} 
            onViewChange={setView} 
            onNewChat={handleNewChat}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
          />

          <div className="flex-1 flex flex-col min-w-0 relative">
            
            {/* Header */}
            <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 no-print sticky top-0 z-10 shadow-sm">
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsMobileOpen(true)}
                    className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Menu size={20} />
                  </button>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
                    {getHeaderTitle()}
                  </h1>
               </div>

               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
               </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
               
               <div className="flex-1 overflow-hidden relative">
                 {view === 'chat' && <ChatView />}
                 {view === 'bookmarks' && <BookmarksView />}
                 {view === 'quiz' && <QuizView />}
                 {view === 'imageToPdf' && <ImageToPdfView />}
                 {view === 'settings' && <SettingsView />}
                 {view === 'history' && <HistoryView />}
               </div>
            </main>
          </div>
      </div>
    </div>
  );
}

export default App;
