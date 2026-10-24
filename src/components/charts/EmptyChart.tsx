/* What a chart shows when there is nothing to plot yet — instead of failing. */
export function EmptyChart({ text }: { text: string }) {
  return (
    <div className="panel-body">
      <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 13.5 }}>{text}</p>
    </div>
  );
}
