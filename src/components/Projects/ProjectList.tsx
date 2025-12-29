'use client';

import Link from 'next/link';
import { usePanelStore } from '@/lib/store';
import { Project } from '@/types';
import { useEffect, useState } from 'react';
import { exportToExcel } from '@/lib/excelExport';

// --- GARANTİ ÇALIŞAN SVG İKONLAR ---
const ExcelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
// ------------------------------------

export default function ProjectList() {
  const { projects, deleteProject, loadProjects, componentLibrary } = usePanelStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadProjects();
  }, [loadProjects]);

  // EXPORT İŞLEMİ
  const handleExport = (e: React.MouseEvent, project: Project) => {
    e.preventDefault(); // Link'e tıklamayı engelle
    e.stopPropagation();
    
    // Güvenli Export Çağrısı
    try {
      exportToExcel(project, null, null, componentLibrary);
    } catch (error) {
      console.error("Export hatası:", error);
      alert("Dosya oluşturulamadı. Konsolu kontrol edin.");
    }
  };

  // SİLME İŞLEMİ
  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
      deleteProject(projectId);
      loadProjects();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!mounted) return null;

  if (projects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">Henüz proje yok</p>
          <p className="text-sm">Başlamak için "+ New Project" butonuna basın.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="bg-white border border-gray-200 rounded-xl p-0 hover:shadow-lg transition-all cursor-pointer block group overflow-hidden"
          >
            {/* --- KART BAŞLIĞI VE BUTONLAR --- */}
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-3">
                <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors truncate">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1 truncate">
                  {project.panelName || 'İsimsiz Pano'}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* YEŞİL EXCEL BUTONU */}
                <button
                  onClick={(e) => handleExport(e, project)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-transparent hover:border-green-200"
                  title="Excel Malzeme Listesi İndir"
                >
                  <ExcelIcon />
                </button>

                {/* SİLME BUTONU */}
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200"
                  title="Projeyi Sil"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {/* --- KART DETAYLARI --- */}
            <div className="p-5">
              <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600">
                <div>
                    <span className="text-gray-400 text-xs uppercase block">Müşteri</span>
                    {project.customer || '-'}
                </div>
                <div>
                    <span className="text-gray-400 text-xs uppercase block">Tarih</span>
                    {formatDate(project.createdAt)}
                </div>
                <div className="mt-2">
                    <span className="text-gray-400 text-xs uppercase block">Pano</span>
                    {project.panels ? project.panels.length : 0} Adet
                </div>
                <div className="mt-2">
                    <span className="text-gray-400 text-xs uppercase block">Parça</span>
                    {project.components ? project.components.length : 0} Adet
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}