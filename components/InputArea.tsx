
import React, { useRef, useState, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, X, StopCircle, Loader2, Camera, Languages, BookOpen, ChevronDown } from 'lucide-react';
import { Subject } from '../types';
import { SUBJECTS, LANGUAGES } from '../constants';
import { useSpeechToText } from '../hooks/useSpeechToText';
import ImageCropper from './ImageCropper';

interface InputAreaProps {
  onSend: (text: string, subject: Subject, images: string[]) => void;
  isLoading: boolean;
  selectedSubject: Subject;
  onSubjectChange: (sub: Subject) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  onSend, 
  isLoading, 
  selectedSubject, 
  onSubjectChange,
  language,
  onLanguageChange
}) => {
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  // Queue for images that need cropping
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeechToText();

  // Sync transcript to input
  useEffect(() => {
    if (transcript) {
        setInput((prev) => prev ? prev + ' ' + transcript : transcript);
        setTranscript(''); // Clear buffer
    }
  }, [transcript, setTranscript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Process files asynchronously
      const filePromises = Array.from(files).map((file: File) => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
      });

      const loadedImages = await Promise.all(filePromises);
      // Add to crop queue
      setCropQueue(prev => [...prev, ...loadedImages]);
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleCropConfirm = (croppedImage: string) => {
    setSelectedImages(prev => [...prev, croppedImage]);
    // Remove the current image from queue
    setCropQueue(prev => prev.slice(1));
  };

  const handleCropCancel = () => {
    // If user cancels, we still skip the current image in queue
    setCropQueue(prev => prev.slice(1));
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!input.trim() && selectedImages.length === 0) return;
    onSend(input, selectedSubject, selectedImages);
    setInput('');
    setSelectedImages([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Cropper Modal */}
      {cropQueue.length > 0 && (
        <ImageCropper 
            imageSrc={cropQueue[0]} 
            onCrop={handleCropConfirm} 
            onCancel={handleCropCancel} 
        />
      )}

      <div className="w-full max-w-4xl mx-auto px-2 pb-4 md:px-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-200 ring-1 ring-gray-100 dark:ring-slate-800 focus-within:ring-2 focus-within:ring-brand-500/50">
          
          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <div className="flex gap-3 p-4 pb-0 overflow-x-auto">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative group flex-shrink-0">
                  <img src={img} alt="preview" className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-100" />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Input Area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Ask a doubt (Math, Physics, History...) or upload an image"}
            className="w-full bg-transparent border-0 focus:ring-0 p-4 pl-5 min-h-[60px] max-h-60 resize-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-gray-500 text-base md:text-lg leading-relaxed"
            rows={1}
          />

          {/* Divider */}
          <div className="h-px w-full bg-gray-100 dark:bg-slate-700/50" />

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between p-3 gap-3 bg-gray-50/30 dark:bg-slate-800/30">
            
            {/* Left: Configuration (Subject & Language) */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
              
               {/* Language Selector Pill */}
              <div className="relative group flex-shrink-0">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-brand-600 dark:text-brand-400">
                    <Languages size={16} />
                  </div>
                  <select 
                      value={language}
                      onChange={(e) => onLanguageChange(e.target.value)}
                      className="appearance-none pl-9 pr-8 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-brand-300 dark:hover:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer shadow-sm"
                  >
                      {LANGUAGES.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                    <ChevronDown size={14} />
                  </div>
              </div>

              {/* Subject Selector Pill */}
              <div className="relative group flex-shrink-0">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-brand-600 dark:text-brand-400">
                    <BookOpen size={16} />
                  </div>
                  <select 
                      value={selectedSubject}
                      onChange={(e) => onSubjectChange(e.target.value as Subject)}
                      className="appearance-none pl-9 pr-8 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-brand-300 dark:hover:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer shadow-sm"
                  >
                      {SUBJECTS.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                    <ChevronDown size={14} />
                  </div>
              </div>
            </div>

            {/* Right: Actions (Media & Send) */}
            <div className="flex items-center gap-1 w-full md:w-auto justify-between md:justify-end">
                
              <div className="flex items-center gap-1 mr-2">
                  {/* Camera Input */}
                  <input 
                    type="file" 
                    ref={cameraInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleImageUpload}
                  />
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all hover:shadow-sm"
                    title="Take Photo"
                  >
                    <Camera size={20} />
                  </button>

                  {/* Gallery Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all hover:shadow-sm"
                    title="Upload Image"
                  >
                    <ImageIcon size={20} />
                  </button>

                  {/* Voice Input */}
                  <button 
                    onClick={isListening ? stopListening : startListening}
                    className={`p-2.5 rounded-full transition-all hover:shadow-sm ${isListening ? 'bg-red-50 text-red-600 animate-pulse ring-2 ring-red-200' : 'text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-700'}`}
                    title="Voice Input"
                  >
                    {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
                  </button>
              </div>

              {/* Send Button */}
              <button 
                onClick={handleSubmit}
                disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
                className={`
                  flex items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg
                  ${(isLoading || (!input.trim() && selectedImages.length === 0))
                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-300 dark:text-slate-500 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:shadow-brand-500/30 hover:scale-105 active:scale-95'
                  }
                `}
              >
                {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} className="ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] md:text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">
          EduMind AI can make mistakes. Please verify important information.
        </p>
      </div>
    </>
  );
};

export default InputArea;
