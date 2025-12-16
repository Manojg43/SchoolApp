import React from 'react';
import QRCode from "react-qr-code";

interface QRCodeDisplayProps {
    value: string;
    size?: number;
    title?: string;
}

export default function QRCodeDisplay({ value, size = 128, title }: QRCodeDisplayProps) {
    return (
        <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            {title && <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>}
            <div className="p-2 bg-white rounded">
                <QRCode
                    size={size}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={value}
                    viewBox={`0 0 256 256`}
                />
            </div>
            <p className="mt-2 text-xs text-gray-400 font-mono break-all max-w-[200px] text-center">
                {value.substring(0, 20)}...
            </p>
        </div>
    );
}
