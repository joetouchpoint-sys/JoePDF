import { DropZone } from './DropZone'
import { Shield, FileText, Zap } from 'lucide-react'
import { useStore } from '@/store'

const features = [
  {
    icon: Shield,
    title: 'Private by default',
    description: 'Documents never leave your browser. All processing happens locally — nothing is uploaded.',
  },
  {
    icon: FileText,
    title: 'Annotate and edit',
    description: 'Add text, shapes, highlights, images and freehand drawings on any page.',
  },
  {
    icon: Zap,
    title: 'Secure redaction',
    description: 'Permanently remove sensitive content via canvas rasterisation — not just a black box.',
  },
]

export function UploadScreen() {
  const branding = useStore((s) => s.branding)

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 gap-10 bg-slate-50">
      {/* Brand header strip */}
      <div className="text-center">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: branding.primaryColor || '#178351', fontFamily: "'DM Sans', system-ui" }}
        >
          {branding.orgName}
        </p>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: branding.secondaryColor || '#292C4F', fontFamily: "'Nunito','VAG Rounded',system-ui" }}
        >
          {branding.appName}
        </h1>
        <p className="text-slate-500 text-base max-w-sm mx-auto">
          Edit, annotate, and redact PDF documents — entirely in your browser.
        </p>
      </div>

      <DropZone />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col items-center text-center gap-2 p-5 bg-white rounded-xl shadow-sm border border-slate-100">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${branding.primaryColor || '#178351'}18` }}
            >
              <Icon className="w-5 h-5" style={{ color: branding.primaryColor || '#178351' }} />
            </div>
            <p
              className="text-sm font-bold"
              style={{ color: branding.secondaryColor || '#292C4F', fontFamily: "'Nunito','VAG Rounded',system-ui" }}
            >
              {title}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
