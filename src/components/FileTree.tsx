"use client";

import { useState } from 'react'
import { Folder, FolderOpen, FileText, ChevronRight } from 'lucide-react'

function FileRow({ node, depth = 0 }: { node: any, depth?: number }) {
  const [open, setOpen] = useState(depth < 2)
  const isDir = node.type === 'dir'
  const hasChildren = isDir && node.children?.length > 0

  const statusClass: Record<string, string> = {
    unused: 'text-danger line-through opacity-70',
    duplicate: 'text-amber-400',
    clean: 'text-[#c8c8d8]',
  };
  const sc = statusClass[node.status] || 'text-[#c8c8d8]'

  const badge = node.status !== 'clean' && (
    <span className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded ${node.status === 'unused' ? 'bg-danger/10 text-danger' : 'bg-amber-400/10 text-amber-400'}`}>
      {node.status}
    </span>
  )

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 px-2 rounded hover:bg-surface2 cursor-pointer text-sm font-mono transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setOpen(o => !o)}
      >
        {hasChildren
          ? <ChevronRight size={13} className={`text-muted shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
          : <span className="w-3.5 shrink-0" />}
        {isDir
          ? (open ? <FolderOpen size={14} className="text-accent shrink-0" /> : <Folder size={14} className="text-accent/60 shrink-0" />)
          : <FileText size={13} className="text-muted shrink-0" />}
        <span className={`truncate text-xs ${sc}`}>{node.name}</span>
        {badge}
      </div>
      {isDir && open && node.children && (
        <div>{node.children.map((child: any) => <FileRow key={child.path} node={child} depth={depth + 1} />)}</div>
      )}
    </div>
  )
}

export default function FileTree({ nodes = [] }: { nodes: any[] }) {
  return <div className="select-none">{nodes.map(n => <FileRow key={n.path} node={n} depth={0} />)}</div>
}
