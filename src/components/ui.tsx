import React from "react"
import type { ReactNode, CSSProperties } from "react"

// ── Card ──────────────────────────────────────────────────
export function Card({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function CardHead({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface2)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--text2)",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  )
}

export function CardBody({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return <div style={{ padding: "14px 16px", ...style }}>{children}</div>
}

// ── Output Box ──────────────────────────────────────────────
export function OutputBox({
  children,
  style,
  minHeight = 100,
}: {
  children?: ReactNode
  style?: CSSProperties
  minHeight?: number
}) {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-sm)",
        padding: "12px 14px",
        fontFamily: "var(--mono)",
        fontSize: 12.5,
        lineHeight: 1.7,
        color: "var(--text2)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        overflowY: "auto",
        minHeight,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Button ──────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "danger" | "green"
const btnStyles: Record<BtnVariant, CSSProperties> = {
  primary: { background: "var(--accent)", color: "#fff", border: "none" },
  secondary: {
    background: "var(--surface2)",
    color: "var(--text2)",
    border: "1px solid var(--border2)",
  },
  danger: {
    background: "var(--red-dim)",
    color: "var(--red)",
    border: "1px solid rgba(244,63,94,.25)",
  },
  green: {
    background: "var(--green-dim)",
    color: "var(--green)",
    border: "1px solid rgba(16,217,160,.25)",
  },
}
export function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
  style,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: BtnVariant
  style?: CSSProperties
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: "var(--r-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "var(--sans)",
        opacity: disabled ? 0.45 : 1,
        transition: "opacity .15s",
        whiteSpace: "nowrap",
        ...btnStyles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ── Label + Input row ────────────────────────────────────────
export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "var(--text3)",
        fontFamily: "var(--mono)",
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  )
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  style,
  onKeyDown,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  style?: CSSProperties
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border2)",
        borderRadius: "var(--r-sm)",
        padding: "7px 11px",
        color: "var(--text)",
        fontSize: 13,
        fontFamily: "var(--sans)",
        outline: "none",
        width: "100%",
        ...style,
      }}
    />
  )
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  style,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  style?: CSSProperties
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border2)",
        borderRadius: "var(--r-sm)",
        padding: "7px 11px",
        color: "var(--text)",
        fontSize: 13,
        fontFamily: "var(--sans)",
        outline: "none",
        width: "100%",
        resize: "vertical",
        ...style,
      }}
    />
  )
}

export function Select({
  value,
  onChange,
  options,
  style,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  style?: CSSProperties
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border2)",
        borderRadius: "var(--r-sm)",
        padding: "7px 11px",
        color: "var(--text)",
        fontSize: 13,
        fontFamily: "var(--sans)",
        outline: "none",
        width: "100%",
        cursor: "pointer",
        ...style,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ── Tag ──────────────────────────────────────────────────────
type TagColor = "blue" | "green" | "amber" | "purple" | "red"
const tagColors: Record<TagColor, CSSProperties> = {
  blue: { background: "var(--accent-dim)", color: "#7fa8ff" },
  green: { background: "var(--green-dim)", color: "var(--green)" },
  amber: { background: "var(--amber-dim)", color: "var(--amber)" },
  purple: { background: "var(--purple-dim)", color: "#a07cff" },
  red: { background: "var(--red-dim)", color: "var(--red)" },
}
export function Tag({
  children,
  color = "blue",
}: {
  children: ReactNode
  color?: TagColor
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontFamily: "var(--mono)",
        marginRight: 6,
        ...tagColors[color],
      }}
    >
      {children}
    </span>
  )
}

// ── Spinner ──────────────────────────────────────────────────
export function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 12,
        height: 12,
        border: "2px solid var(--border2)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        animation: "spin .6s linear infinite",
      }}
    />
  )
}

// ── Log line helpers ─────────────────────────────────────────
export function LogLine({
  children,
  color,
  style,
}: {
  children: ReactNode
  color?: string
  style?: CSSProperties
}) {
  return (
    <div style={{ color: color ?? "var(--text2)", lineHeight: 1.7, ...style }}>
      {children}
    </div>
  )
}

// ── Panel layout ─────────────────────────────────────────────
export function PanelHeader({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children?: ReactNode
}) {
  return (
    <div
      style={{
        padding: "18px 24px 14px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontSize: 19,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {desc && (
        <div style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5 }}>
          {children}
          {desc}
        </div>
      )}
      {!desc && children}
    </div>
  )
}

export function SplitLayout({
  left,
  right,
  leftWidth = 320,
}: {
  left: ReactNode
  right: ReactNode
  leftWidth?: number
}) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        gap: 16,
        padding: "18px 20px",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <div
        style={{
          width: leftWidth,
          minWidth: leftWidth,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {left}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          overflow: "hidden",
        }}
      >
        {right}
      </div>
    </div>
  )
}

// ── Sep ──────────────────────────────────────────────────────
export function Sep() {
  return (
    <div style={{ height: 1, background: "var(--border)", margin: "10px 0" }} />
  )
}

// ── Flex helpers ──────────────────────────────────────────────
export function Row({
  children,
  gap = 8,
  style,
}: {
  children: ReactNode
  gap?: number
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: "flex",
        gap,
        alignItems: "flex-end",
        flexWrap: "wrap",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Col({
  children,
  gap = 10,
  style,
}: {
  children: ReactNode
  gap?: number
  style?: CSSProperties
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {children}
    </div>
  )
}
