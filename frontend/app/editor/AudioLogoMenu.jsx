'use client';

import { useState, useMemo } from 'react';

const AUDIO_GROUPS = ['Mint', 'Lavender', 'Peach', 'Lemon', 'Aqua', 'Taffy'];

export default function AudioLogoMenu({ audioLogos, handleAddAudioLogo }) {
  const [openColor, setOpenColor] = useState(null);

  const groupAudioLogos = useMemo(() => {
    return AUDIO_GROUPS.map((groupName) => ({
      groupName,
      variants: audioLogos.filter((logo) => logo.name.toLowerCase().includes(groupName.toLowerCase())),
    })).filter((group) => group.variants.length > 0);
  }, [audioLogos]);

  return (
    <div className="relative">
      {/* Main dropdown trigger */}
      <div className="relative group">
        <button className="text-black hover:text-black font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors">
          Audio Logo ▾
        </button>

        {/* Color list */}
        <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 py-1 max-h-[420px] overflow-y-auto">
          {groupAudioLogos.map(({ groupName, variants }) => (
            <div
              key={groupName}
              className="border-b border-gray-100 last:border-b-0"
            >
              <button
                onClick={() => setOpenColor((prev) => (prev === groupName ? null : groupName))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <span>{groupName}</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {openColor === groupName && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-1 gap-1">
                    {variants.map((logo) => {
                      return (
                        <button
                          key={logo.id}
                          onClick={() => handleAddAudioLogo(logo.filePath)}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        >
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded border border-gray-100">
                            <img
                              src={logo.filePath}
                              alt={logo.name}
                              className="max-h-8 max-w-full object-contain"
                            />
                          </div>
                          <span className="text-xs text-gray-600">{logo.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
