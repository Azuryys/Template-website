import { useState } from 'react';

export default function ContentMenu({ recentImages, onSelectImage }) {
  const [isOpen, setIsOpen] = useState(false);

  if (recentImages.length === 0) {
    return (
      <div className="relative">
        <button 
          disabled
          className="text-gray-400 font-medium px-3 py-1 rounded cursor-not-allowed"
          title="No recent images in the past 7 days"
        >
          Content ▾
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative group">
        <button 
          className="text-black hover:text-black font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          Content ▾
        </button>

        {isOpen && (
          <div 
            className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {recentImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() => {
                    onSelectImage(image.src);
                    setIsOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 group/item"
                  title={new Date(image.uploadedAt).toLocaleDateString()}
                >
                  <div className="w-full h-12 flex items-center justify-center bg-gray-50 rounded border border-gray-100 overflow-hidden">
                    <img
                      src={image.src}
                      alt="Recent content"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 text-center line-clamp-1">
                    {new Date(image.uploadedAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}