'use client';

import { useState, useRef, useCallback } from 'react';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从 localStorage 读取 API Key
  if (typeof window !== 'undefined' && !apiKey) {
    const savedKey = localStorage.getItem('removebg_apikey');
    if (savedKey) setApiKey(savedKey);
  }

  const handleFileSelect = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setResultImage(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const processImage = async () => {
    if (!originalImage || !apiKey) {
      setError('请先上传图片并输入 API Key');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const base64Data = originalImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const imageFile = new File([byteArray], 'image.png', { type: 'image/png' });

      const formData = new FormData();
      formData.append('image_file', imageFile);
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': apiKey },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.title || '处理失败');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('removebg_apikey', key);
  };

  const downloadImage = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'removed-bg.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setError('');
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
        🖼️ 图片背景去除
      </h1>
      <p className="text-gray-400 mb-8">一键去除图片背景，下载透明背景图</p>

      {/* 设置按钮 */}
      <div className="fixed top-4 right-4">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-4 py-2 bg-white/10 border border-gray-700 rounded-lg text-gray-400 hover:bg-white/20 hover:text-white transition"
        >
          ⚙️ API Key
        </button>
      </div>

      {/* API Key 设置面板 */}
      {showSettings && (
        <div className="w-full max-w-md mb-8 p-4 bg-white/5 border border-gray-700 rounded-xl">
          <label className="block text-sm text-gray-400 mb-2">Remove.bg API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => saveApiKey(e.target.value)}
            placeholder="输入 API Key"
            className="w-full px-4 py-2 bg-white/10 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
          <p className="text-xs text-gray-500 mt-2">
            免费注册: <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">https://www.remove.bg/api</a>
          </p>
        </div>
      )}

      {/* 上传区域 */}
      {!originalImage && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="w-full max-w-xl p-16 border-2 border-dashed border-gray-600 rounded-2xl text-center cursor-pointer bg-white/5 hover:border-cyan-400 hover:bg-white/10 transition"
        >
          <div className="text-6xl mb-4">📁</div>
          <p className="text-xl text-gray-300 mb-2">点击或拖拽上传图片</p>
          <p className="text-gray-500">支持 PNG, JPG, WEBP</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
      />

      {/* 错误提示 */}
      {error && (
        <div className="w-full max-w-xl mt-4 p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* 处理按钮 */}
      {originalImage && !resultImage && (
        <div className="mt-8 flex gap-4">
          <button onClick={reset} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white transition">
            🔄 重新选择
          </button>
          <button
            onClick={processImage}
            disabled={isProcessing || !apiKey}
            className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 rounded-xl text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '处理中...' : '✨ 去除背景'}
          </button>
        </div>
      )}

      {/* 加载动画 */}
      {isProcessing && (
        <div className="mt-12 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-cyan-400 rounded-full spinner"></div>
          <p className="mt-4 text-gray-400">正在去除背景...</p>
        </div>
      )}

      {/* 预览区域 */}
      {(originalImage || resultImage) && (
        <div className="mt-12 flex flex-wrap justify-center gap-8">
          {originalImage && (
            <div className="text-center">
              <h3 className="text-gray-400 mb-4">原图</h3>
              <img src={originalImage} alt="Original" className="max-w-xs max-h-80 rounded-xl shadow-2xl" />
            </div>
          )}
          
          {resultImage && (
            <div className="text-center">
              <h3 className="text-gray-400 mb-4">结果</h3>
              <div className="inline-block checkerboard rounded-xl overflow-hidden shadow-2xl">
                <img src={resultImage} alt="Result" className="max-w-xs max-h-80" />
              </div>
              <div className="mt-4">
                <button onClick={downloadImage} className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 rounded-xl text-white font-semibold transition">
                  ⬇️ 下载图片
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-16 text-center text-gray-500 text-sm">
        <p>Powered by Remove.bg API</p>
      </div>
    </main>
  );
}
