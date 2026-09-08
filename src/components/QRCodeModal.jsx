import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, QrCode, Copy, Download, ExternalLink, Wifi, Globe, Smartphone, Check, RefreshCw } from 'lucide-react';
import { API_BASE } from '../constants.js';

const DEFAULT_SERVER_URL = 'http://47.103.7.184';

export default function QRCodeModal({ isOpen, onClose, setToast }) {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAddressType, setSelectedAddressType] = useState('server'); // 'server' | 'lan' | 'custom'
  const [selectedIp, setSelectedIp] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef(null);

  // Fetch backend network interfaces on mount or open
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch(`${API_BASE}/system/network-info`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNetworkInfo(data);
          if (data.primaryIp) {
            setSelectedIp(data.primaryIp);
          }
        }
      })
      .catch(err => {
        console.warn('Failed to load network info:', err);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine current browser port and protocol
  const protocol = window.location.protocol; // 'http:' or 'https:'
  const browserPort = window.location.port ? `:${window.location.port}` : '';
  const currentOrigin = window.location.origin;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Compute final QR code URL based on selection
  let finalUrl = DEFAULT_SERVER_URL;
  if (selectedAddressType === 'server') {
    finalUrl = isLocalhost ? DEFAULT_SERVER_URL : currentOrigin;
  } else if (selectedAddressType === 'custom' && customUrl.trim()) {
    finalUrl = customUrl.trim().startsWith('http') ? customUrl.trim() : `${protocol}//${customUrl.trim()}`;
  } else if (selectedAddressType === 'lan') {
    if (selectedIp) {
      finalUrl = `${protocol}//${selectedIp}${browserPort || (isLocalhost ? ':5173' : '')}`;
    } else {
      finalUrl = currentOrigin;
    }
  } else if (selectedAddressType === 'auto') {
    finalUrl = isLocalhost ? (selectedIp ? `${protocol}//${selectedIp}${browserPort || ':5173'}` : DEFAULT_SERVER_URL) : currentOrigin;
  }

  // Copy to clipboard handler
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(finalUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = finalUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      if (setToast) setToast({ message: '访问链接已复制到剪贴板', type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      if (setToast) setToast({ message: '复制链接失败，请手动复制', type: 'error' });
    }
  };

  // Download QR Code image handler
  const handleDownload = () => {
    try {
      const canvas = document.getElementById('qr-code-canvas-element');
      if (!canvas) return;
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `VehicleTestRecorder-QRCode-${new Date().toISOString().slice(0,10)}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      if (setToast) setToast({ message: '二维码图片已下载', type: 'success' });
    } catch (e) {
      if (setToast) setToast({ message: '下载二维码失败', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#1e293b] rounded-[24px] shadow-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow & Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <QrCode size={22} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                微信扫一扫访问
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">
                  Mobile Live
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">手机扫码随时随地录入车辆测试数据</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {/* QR Code Container */}
          <div className="relative p-4 rounded-2xl bg-white dark:bg-white shadow-lg border border-slate-200/60 dark:border-slate-700 flex items-center justify-center group">
            <QRCodeCanvas
              id="qr-code-canvas-element"
              value={finalUrl}
              size={210}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/favicon.ico",
                height: 38,
                width: 38,
                excavate: true,
              }}
            />
            {/* Corner Decorative Borders */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-500 rounded-br-sm pointer-events-none" />
          </div>

          {/* WeChat Scan Instructions */}
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
            <Smartphone size={14} />
            <span>打开手机微信「扫一扫」即可直接进入系统</span>
          </div>

          {/* Preset Buttons */}
          <div className="w-full mt-4 flex items-center gap-2">
            <button
              onClick={() => setSelectedAddressType('server')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                selectedAddressType === 'server'
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              ☁️ 云服务器公网
            </button>
            <button
              onClick={() => setSelectedAddressType('lan')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                selectedAddressType === 'lan'
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              📶 局域网 Wi-Fi
            </button>
          </div>

          {/* Address Display & Selector */}
          <div className="w-full mt-3 space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Wifi size={13} className="text-blue-500" />
                  当前访问地址
                </span>
                {isLocalhost && (
                  <span className="text-amber-500 dark:text-amber-400 font-medium">
                    (已自动适配手机可访问的局域网IP)
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-slate-800 dark:text-slate-200 break-all select-all font-semibold bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                {finalUrl}
              </div>
            </div>

            {/* Network / IP Selector Options */}
            {networkInfo && networkInfo.ips && networkInfo.ips.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">切换网络IP:</span>
                <select
                  value={selectedIp}
                  onChange={(e) => {
                    setSelectedIp(e.target.value);
                    setSelectedAddressType('lan');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {networkInfo.ips.map((item, idx) => (
                    <option key={idx} value={item.address}>
                      {item.address} ({item.name || 'LAN'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom URL mode toggle */}
            <div className="pt-1">
              {selectedAddressType === 'custom' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="输入公网域名/穿透地址 (如 https://lab.test.com)"
                    className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      setSelectedAddressType('auto');
                      setCustomUrl('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    重置
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedAddressType('custom');
                    setCustomUrl(finalUrl);
                  }}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Globe size={12} />
                  使用自定义公网域名或穿透地址生成二维码
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 h-10 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <Download size={14} />
            保存二维码图片
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-600/20"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '已复制链接' : '复制手机链接'}
          </button>
        </div>

        {/* LAN Wi-Fi Tips */}
        <div className="px-6 pb-4 pt-1 bg-slate-50 dark:bg-slate-800/40 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            * 局域网测试时，请确保手机与电脑连接在同一个 Wi-Fi 网络下
          </p>
        </div>
      </div>
    </div>
  );
}
