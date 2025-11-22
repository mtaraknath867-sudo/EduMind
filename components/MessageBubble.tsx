import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { User, Bot, Copy, Check, Bookmark, FileDown } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onBookmark?: (text: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onBookmark }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById(`msg-content-${message.id}`);
    if (!element) return;

    // Check if html2pdf is loaded from index.html script
    if (typeof window !== 'undefined' && (window as any).html2pdf) {
        const opt = {
            margin: [20, 15, 20, 15], // Increased top/bottom margin for header/footer
            filename: `edumind-note-${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Generate PDF with callback to add header/footer
        (window as any).html2pdf()
            .set(opt)
            .from(element)
            .toPdf()
            .get('pdf')
            .then((pdf: any) => {
                const totalPages = pdf.internal.getNumberOfPages();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    
                    // Header: App Name
                    pdf.setFontSize(10);
                    pdf.setTextColor(100, 116, 139); // Slate-500
                    pdf.text('EduMind AI', 15, 12);
                    
                    // Header: Line
                    pdf.setDrawColor(226, 232, 240); // Slate-200
                    pdf.line(15, 15, pageWidth - 15, 15);

                    // Footer: Page Number
                    pdf.setFontSize(9);
                    const pageStr = `Page ${i} of ${totalPages}`;
                    pdf.text(pageStr, pageWidth - 35, pageHeight - 10);
                }
            })
            .save();
    } else {
        // Fallback if script not loaded
        window.print();
    }
  };

  // Show actions for AI messages OR User messages that have images (so user can convert their photo to PDF)
  const showActions = !isUser || (isUser && message.images && message.images.length > 0);

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-brand-600' : 'bg-emerald-600'} text-white shadow-sm mt-1`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Content Bubble Container */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            {/* Subject badge for user messages if it exists */}
            {isUser && message.subject && message.subject !== 'General' && (
                <span className="text-xs text-slate-400 mb-1 pr-1">
                   Topic: {message.subject}
                </span>
            )}

            <div 
              id={`msg-content-${message.id}`}
              className={`
              relative rounded-2xl px-5 py-4 shadow-sm border
              ${isUser 
                ? 'bg-brand-600 text-white border-brand-600 rounded-tr-sm' 
                : 'bg-white dark:bg-slate-800 dark:border-slate-700 border-gray-200 text-slate-800 dark:text-slate-100 rounded-tl-sm'
              }
            `}>
              
              {/* Attached Images */}
              {message.images && message.images.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {message.images.map((img, idx) => (
                    <img 
                        key={idx} 
                        src={img} 
                        alt="Attachment" 
                        className="w-32 h-32 object-cover rounded-lg border-2 border-white/20" 
                    />
                  ))}
                </div>
              )}

              {/* Text Content */}
              <div className={`prose ${isUser ? 'prose-invert' : 'dark:prose-invert'} max-w-none prose-sm md:prose-base leading-relaxed break-words`}>
                <ReactMarkdown>
                  {message.text}
                </ReactMarkdown>
              </div>
            </div>

            {/* Action Bar */}
            {showActions && !message.isError && (
                <div className={`flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                    
                    {/* Copy (Only relevant for text usually) */}
                    <button 
                        onClick={handleCopy}
                        className="p-1.5 text-slate-400 hover:text-brand-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        title="Copy Text"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    
                    {/* Bookmark (Only for AI messages usually) */}
                    {!isUser && (
                        <button 
                            onClick={() => onBookmark?.(message.text)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            title="Save Note"
                        >
                            <Bookmark size={14} />
                        </button>
                    )}

                    {/* Download PDF */}
                    <button 
                        onClick={handleDownloadPDF}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        title="Download PDF"
                    >
                        <FileDown size={14} />
                    </button>
                </div>
            )}
            
            {/* Error State */}
            {message.isError && (
                 <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span>⚠️ Error processing request</span>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;