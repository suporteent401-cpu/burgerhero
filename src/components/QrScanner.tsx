import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode';
import { XCircle } from 'lucide-react';

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (errorMessage: string) => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScan, onError }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner-container';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(scannerContainerId);
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdge * 0.7);
              return { width: qrboxSize, height: qrboxSize };
            },
          },
          (decodedText: string, result: Html5QrcodeResult) => {
            if (scannerRef.current?.isScanning) {
              onScan(decodedText);
              stopScanner();
            }
          },
          (errorMessage: string, error: Html5QrcodeError) => {
            // Ignore non-fatal scanning errors
          }
        );
      } catch (err: any) {
        console.error('QR Scanner Error:', err);
        if (err.name === 'NotAllowedError') {
          setErrorMessage('Não foi possível acessar a câmera. Verifique as permissões do navegador ou use a busca manual.');
        } else if (err.name === 'NotFoundError') {
          setErrorMessage('Nenhuma câmera encontrada. Use a busca manual.');
        } else {
          setErrorMessage('Ocorreu um erro ao iniciar a câmera. Use a busca manual.');
        }
        if (onError) {
          onError(err.message);
        }
      }
    };

    const stopScanner = () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(err => {
          console.error('Failed to stop scanner:', err);
        });
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScan, onError]);

  return (
    <div className="w-full h-full relative bg-black">
      <div id={scannerContainerId} className="w-full h-full" />
      {errorMessage && (
        <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-center p-4">
          <XCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-white font-bold text-lg">Erro na Câmera</p>
          <p className="text-slate-300 max-w-sm">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default QrScanner;