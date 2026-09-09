import React from 'react';

export const TVSettings: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f0f0f] p-12">
      <h1 className="text-4xl font-bold text-white mb-8">Cài Đặt</h1>
      
      <div className="flex flex-col gap-6 max-w-2xl">
        <button
          data-tv-focusable="true"
          className="bg-gray-800 p-6 rounded-xl text-left focus:scale-105 focus:bg-white focus:text-black transition-all"
        >
          <h2 className="text-2xl font-bold mb-2">Xóa Dữ Liệu</h2>
          <p className="opacity-80">Xóa bộ nhớ đệm và dữ liệu đã lưu.</p>
        </button>

        <button
          data-tv-focusable="true"
          className="bg-gray-800 p-6 rounded-xl text-left focus:scale-105 focus:bg-white focus:text-black transition-all"
        >
          <h2 className="text-2xl font-bold mb-2">Giới Thiệu</h2>
          <p className="opacity-80">Ứng dụng Cinevina TV v1.0.0</p>
        </button>
      </div>
    </div>
  );
};
