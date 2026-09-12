import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BarcodeTagProps {
  product: Product;
  onSimulateScan?: (code: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const BarcodeTag: React.FC<BarcodeTagProps> = ({
  product,
  onSimulateScan,
  size = 'md',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const barcodeValue = product.sku || product.code;

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, barcodeValue, {
          format: 'CODE128',
          width: size === 'sm' ? 1.4 : size === 'lg' ? 2.2 : 1.8,
          height: size === 'sm' ? 38 : size === 'lg' ? 60 : 48,
          displayValue: true,
          font: 'monospace',
          fontSize: size === 'sm' ? 10 : size === 'lg' ? 13 : 11,
          textMargin: 3,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (e) {
        console.warn('JsBarcode render error:', e);
      }
    }

    QRCode.toDataURL(barcodeValue, {
      width: size === 'sm' ? 70 : size === 'lg' ? 100 : 80,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((e) => console.warn('QR render error:', e));
  }, [barcodeValue, size]);

  return (
    <div className="bg-white text-slate-900 rounded-xl p-3 border-2 border-slate-200 shadow-sm flex flex-col items-center select-none text-center">
      {/* Product Tag Header */}
      <div className="w-full flex items-center justify-between gap-2 border-b border-dashed border-slate-200 pb-1.5 mb-1.5">
        <span className="text-[11px] font-bold truncate max-w-[170px] text-slate-800">
          {product.name}
        </span>
        <span className="text-[11px] font-extrabold text-blue-600 font-mono flex-shrink-0">
          {formatCurrency(product.price)}
        </span>
      </div>

      {/* Barcode & QR Display */}
      <div className="flex items-center justify-center gap-2 my-1 w-full overflow-hidden">
        {/* 1D Code-128 Barcode */}
        <div className="flex-1 flex justify-center bg-white p-1 rounded">
          <svg ref={svgRef} className="max-w-full h-auto" />
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="flex flex-col items-center flex-shrink-0 border-l border-slate-200 pl-2">
            <img src={qrDataUrl} alt="QR Code" className="w-14 h-14 object-contain" />
            <span className="text-[8px] font-mono text-slate-400">QR</span>
          </div>
        )}
      </div>

      {/* Simulator click action */}
      {onSimulateScan && (
        <button
          onClick={() => onSimulateScan(barcodeValue)}
          className="w-full mt-1.5 py-1 px-2 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center justify-center gap-1"
        >
          <span>⚡ Bấm thử mã: {barcodeValue}</span>
        </button>
      )}
    </div>
  );
};
