import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Renders a QR code for a join URL. Pure client-side, no external service.
export default function Qr({ value, size = 200 }: { value: string; size?: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: "#2A2118", light: "#FFFFFF" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value, size]);
  if (!src) return <div style={{ width: size, height: size, background: "var(--cream-2)", borderRadius: 12 }} />;
  return <img src={src} width={size} height={size} alt="Join QR code" style={{ borderRadius: 12 }} />;
}
