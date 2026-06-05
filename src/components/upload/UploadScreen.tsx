import { DropZone } from './DropZone'
import { Shield, PenLine, EraserIcon, LayoutGrid } from 'lucide-react'
import { useStore } from '@/store'

const features = [
  {
    icon: Shield,
    title: 'Private by default',
    description: 'Your documents never leave your device. Everything is processed in your browser — nothing is uploaded.',
  },
  {
    icon: PenLine,
    title: 'Annotate and edit',
    description: 'Add text, shapes, highlights, images, and freehand drawings to any page.',
  },
  {
    icon: EraserIcon,
    title: 'Redact sensitive content',
    description: 'Permanently remove text or images you want gone. Once saved, redacted content cannot be recovered or revealed.',
  },
  {
    icon: LayoutGrid,
    title: 'Manage pages',
    description: 'Reorder, merge, split, and extract pages. Build exactly the document you need.',
  },
]

export function UploadScreen() {
  const branding = useStore((s) => s.branding)

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 gap-10 bg-slate-50">
      {/* Brand header */}
      <div className="text-center">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: branding.primaryColor || '#178351', fontFamily: "'DM Sans', system-ui" }}
        >
          {branding.orgName}
        </p>
        {branding.logoDataUrl ? (
          <img
            src={branding.logoDataUrl}
            alt={branding.appName}
            className="h-16 w-auto object-contain mx-auto mb-3"
          />
        ) : (
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: branding.secondaryColor || '#292C4F', fontFamily: "'Nunito','VAG Rounded',system-ui" }}
          >
            {branding.appName}
          </h1>
        )}
        <p className="text-slate-500 text-base max-w-sm mx-auto">
          Edit, redact, and manage PDF documents — entirely in your browser.
        </p>
      </div>

      <DropZone />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl w-full">
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
