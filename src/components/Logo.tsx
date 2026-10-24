import Image from "next/image";

/* The Cadastra emblem (public/brand, made from the marketplace logo file) */
export function LogoMark({ size = 36 }: { size?: number }) {
  return <Image src="/brand/cadastra-mark.webp" alt="" width={size} height={size} priority aria-hidden="true" />;
}

/* The full logo — emblem and wordmark — for larger places */
export function LogoFull({ width = 200, className }: { width?: number; className?: string }) {
  return (
    <Image src="/brand/cadastra-logo.webp" alt="Cadastra" width={width} height={Math.round(width * 985 / 1196)} className={className} />
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} />
      <span
        style={{
          fontFamily: "var(--display)",
          fontWeight: 600,
          fontSize: 17,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
          whiteSpace: "nowrap",
          display: "inline-flex",
          flexDirection: "column",
          lineHeight: 1.05,
        }}
      >
        Cadastra
        <small style={{ display: "block", fontFamily: "var(--mono)", fontWeight: 400, fontSize: 9.5, letterSpacing: ".12em",
          textTransform: "uppercase", color: "var(--ink-3)", marginTop: 1 }}>
          by Terra Ledger
        </small>
      </span>
    </span>
  );
}
