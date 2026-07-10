'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="min-w-24 whitespace-nowrap text-xs font-mono tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2 flex-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 min-w-7 cursor-pointer rounded border border-border bg-transparent p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs font-mono bg-secondary border-border text-foreground px-2"
          maxLength={7}
        />
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, maxLength = 32 }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs bg-secondary border-border text-foreground"
        maxLength={maxLength}
      />
    </div>
  )
}

export default function ConfigPanel({ data, onChange }) {
  const set = (key, value) =>
    onChange({ ...data, [key]: value })

  const setColor = (key, value) =>
    onChange({ ...data, colors: { ...data.colors, [key]: value } })

  return (
    <div className="flex flex-col gap-5 w-72">
      {/* Text fields */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono tracking-widest text-muted-foreground">TEXT — FRONT</p>
        <TextField label="Name" value={data.name} onChange={(v) => set('name', v)} />
        <TextField label="Location" value={data.location} onChange={(v) => set('location', v)} />
        <TextField label="Venue" value={data.venue} onChange={(v) => set('venue', v)} />
        <TextField label="Address" value={data.address} onChange={(v) => set('address', v)} />
        <TextField label="Website" value={data.website} onChange={(v) => set('website', v)} />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono tracking-widest text-muted-foreground">TEXT — BACK</p>
        <TextField label="Company" value={data.company ?? ''} onChange={(v) => set('company', v)} />
        <TextField label="Tagline" value={data.tagline ?? ''} onChange={(v) => set('tagline', v)} />
        <TextField label="Email" value={data.email ?? ''} onChange={(v) => set('email', v)} />
        <TextField label="Phone" value={data.phone ?? ''} onChange={(v) => set('phone', v)} />
      </div>

      {/* Color fields */}
      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-mono tracking-widest text-muted-foreground">COLORS</p>
        <ColorField label="Card BG" value={data.colors.cardBg} onChange={(v) => setColor('cardBg', v)} />
        <ColorField label="Accent" value={data.colors.accentColor} onChange={(v) => setColor('accentColor', v)} />
        <ColorField label="Name" value={data.colors.nameColor} onChange={(v) => setColor('nameColor', v)} />
        <ColorField label="Role" value={data.colors.roleColor} onChange={(v) => setColor('roleColor', v)} />
        <ColorField label="Meta" value={data.colors.metaColor} onChange={(v) => setColor('metaColor', v)} />
        <ColorField label="Footer BG" value={data.colors.footerBg} onChange={(v) => setColor('footerBg', v)} />
        <ColorField label="Footer Text" value={data.colors.footerText} onChange={(v) => setColor('footerText', v)} />
        <ColorField label="Ring" value={data.colors.ringColor} onChange={(v) => setColor('ringColor', v)} />
      </div>
    </div>
  )
}
