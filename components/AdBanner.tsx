import React, { useEffect, useRef } from 'react';

const AdBanner: React.FC = () => {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = bannerRef.current;
    if (!container) return;

    // Clear previous content to avoid duplicates
    container.innerHTML = '';
    
    const iframe = document.createElement('iframe');
    iframe.style.width = '320px';
    iframe.style.height = '50px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    iframe.title = "Advertisement";
    
    container.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        overflow: hidden; 
                        background: transparent; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center;
                        height: 100%;
                    }
                </style>
            </head>
            <body>
                <script type="text/javascript">
                    atOptions = {
                        'key' : 'aace65f4c73081a1abedbe3104cb5710',
                        'format' : 'iframe',
                        'height' : 50,
                        'width' : 320,
                        'params' : {}
                    };
                </script>
                <script type="text/javascript" src="https://www.highperformanceformat.com/aace65f4c73081a1abedbe3104cb5710/invoke.js"></script>
            </body>
            </html>
        `);
        doc.close();
    }

    return () => {
        if (container) container.innerHTML = '';
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-3 bg-transparent print:hidden z-0 relative">
        <div ref={bannerRef} className="w-[320px] h-[50px] bg-gray-50 dark:bg-slate-900 rounded-md flex justify-center items-center overflow-hidden shadow-sm border border-gray-200 dark:border-slate-800" />
    </div>
  );
};

export default AdBanner;