import React, { useState, useEffect } from "react";

const formatAdobeTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds} +05'30'`;
};

export default function AdobeDigitalSignature({
  signatoryName = "MOHMADSIRAJ YUNUSH SHERASIYA",
  className = "",
}) {
  const [signatureImg, setSignatureImg] = useState(() => {
    return localStorage.getItem("wolego_digital_signature") || null;
  });

  const [currentTimestamp, setCurrentTimestamp] = useState(() => formatAdobeTimestamp());

  useEffect(() => {
    setCurrentTimestamp(formatAdobeTimestamp());
  }, []);

  // Listen for storage changes if signature is updated
  useEffect(() => {
    const handleStorage = () => {
      setSignatureImg(localStorage.getItem("wolego_digital_signature") || null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const storedName = localStorage.getItem("wolego_signatory_name") || signatoryName;

  return (
    <div className={`flex items-center justify-center my-0.5 select-none font-sans text-left ${className}`}>
      {signatureImg ? (
        <div className="flex flex-col items-center">
          <img
            src={signatureImg}
            alt="Authorised Digital Signature"
            className="h-8 w-auto max-w-[130px] object-contain mix-blend-multiply"
          />
          <div className="text-[6.5px] text-slate-500 font-mono tracking-tighter mt-0.5">
            Digitally signed by {storedName} | Date: {currentTimestamp}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 border border-slate-300 px-1 py-[1px] bg-white shadow-2xs">
          {/* Left Column: Full Bold Name on 1 single line */}
          <div className="font-black text-[6px] text-slate-900 leading-none uppercase whitespace-nowrap border-r border-slate-300 pr-1">
            {storedName}
          </div>

          {/* Right Column: Adobe Style Verification lines */}
          <div className="text-[5.5px] text-slate-800 leading-tight font-mono whitespace-nowrap">
            <div className="text-slate-500 font-sans text-[5px] leading-none whitespace-nowrap">Digitally signed by</div>
            <div className="font-bold text-slate-900 uppercase text-[5.5px] leading-none whitespace-nowrap">{storedName}</div>
            <div className="text-slate-500 leading-none whitespace-nowrap text-[5px]">Date: {currentTimestamp}</div>
          </div>
        </div>
      )}
    </div>
  );
}
