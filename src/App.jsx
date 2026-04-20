import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  Code2,
  Cpu,
  FilePenLine,
  Link2,
  Plus,
  Search,
  Target,
  Trash2,
  UploadCloud,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { ref, onValue, push, remove, set, update } from 'firebase/database'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { db, storage } from './firebase-config'

const DEFAULT_PROJECT_FORM = {
  title: '',
  group: '',
  description: '',
  components: '',
}

const DEFAULT_UPDATE_FORM = {
  title: '',
  objective: '',
  description: '',
  documentation: '',
  documentationType: '',
  documentationName: '',
  challenges: '',
  nextTarget: '',
  code: '',
}

const uploadApiEndpoint = import.meta.env.VITE_UPLOAD_API_ENDPOINT
const uploadPublicBaseUrl = (import.meta.env.VITE_UPLOAD_PUBLIC_BASE_URL || '').replace(/\/+$/, '')

const extractPublicUrlFromPayload = (payload) => {
  const directUrl = payload?.publicUrl || payload?.fileUrl || payload?.url
  if (typeof directUrl === 'string' && directUrl.trim()) {
    if (directUrl.startsWith('http')) {
      return directUrl
    }

    if (uploadPublicBaseUrl) {
      return `${uploadPublicBaseUrl}/${directUrl.replace(/^\/+/, '')}`
    }
  }

  const objectKey = payload?.objectKey || payload?.key || payload?.path || payload?.fileKey
  if (typeof objectKey === 'string' && objectKey.trim() && uploadPublicBaseUrl) {
    return `${uploadPublicBaseUrl}/${objectKey.replace(/^\/+/, '')}`
  }

  return ''
}

const extractUploadUrlFromPayload = (payload) =>
  payload?.uploadUrl || payload?.presignedUrl || payload?.signedUrl || ''

const toDateLabel = (value) => {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate)
}

const todayIso = () => new Date().toISOString().split('T')[0]
const normalizeStatus = (value = '') => (value.toLowerCase() === 'completed' ? 'Completed' : 'In Progress')

const isImageType = (type = '') => type.startsWith('image/')
const isVideoType = (type = '') => type.startsWith('video/')
const isPdfType = (type = '', url = '') => type.includes('pdf') || url.toLowerCase().endsWith('.pdf')

const DocumentationPreview = ({ item }) => {
  const [imgError, setImgError] = React.useState(false)
  const [pdfError, setPdfError] = React.useState(false)

  if (!item.documentation) {
    return null
  }

  const documentationType = item.documentationType || ''

  return (
    <div className="space-y-2">
      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-100">
        <Link2 size={15} />
        Dokumentasi Terunggah
      </p>

      {isImageType(documentationType) && (
        imgError ? (
          <div className="rounded-xl border border-cyan-200/25 bg-cyan-400/10 p-3 text-sm text-cyan-50">
            Gambar tidak dapat ditampilkan. Gunakan tombol di bawah untuk membuka langsung.
          </div>
        ) : (
          <img
            src={item.documentation}
            alt={item.documentationName || 'Dokumentasi proyek'}
            className="h-auto w-full max-h-[60vh] rounded-xl border border-white/15 object-contain"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )
      )}

      {isVideoType(documentationType) && (
        <div className="w-full overflow-hidden rounded-xl border border-white/15 bg-slate-950">
          <video
            src={item.documentation}
            controls
            className="h-auto w-full max-h-[60vh]"
          >
            Browser tidak mendukung preview video.
          </video>
        </div>
      )}

      {isPdfType(documentationType, item.documentation) && (
        pdfError ? (
          <div className="rounded-xl border border-cyan-200/25 bg-cyan-400/10 p-3 text-sm text-cyan-50">
            PDF tidak dapat dipreview di browser ini. Gunakan tombol di bawah untuk membuka langsung.
          </div>
        ) : (
          <div className="w-full overflow-hidden rounded-xl border border-white/15 bg-white">
            <iframe
              src={item.documentation}
              title={item.documentationName || 'Preview PDF'}
              className="h-[60vh] w-full"
              onError={() => setPdfError(true)}
            />
          </div>
        )
      )}

      {!isImageType(documentationType) &&
        !isVideoType(documentationType) &&
        !isPdfType(documentationType, item.documentation) && (
          <div className="rounded-xl border border-cyan-200/25 bg-cyan-400/10 p-3 text-sm text-cyan-50">
            File tidak bisa dipreview langsung di browser.
          </div>
        )}

      <a
        href={item.documentation}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-200/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-50 transition hover:bg-cyan-400/20 sm:w-auto"
      >
        <Link2 size={14} />
        {item.documentationName ? `Buka ${item.documentationName}` : 'Buka Dokumentasi'}
      </a>
    </div>
  )
}

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-3xl' }) => {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full ${maxWidth} rounded-3xl border border-white/20 bg-[var(--panel)] p-5 shadow-2xl backdrop-blur-xl md:p-8`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100 md:text-2xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 p-2 text-slate-300 transition hover:border-white/40 hover:text-white"
            aria-label="Tutup modal"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function App() {
  const [projects, setProjects] = useState([])
  const [currentView, setCurrentView] = useState('dashboard')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [newProject, setNewProject] = useState(DEFAULT_PROJECT_FORM)
  const [newUpdate, setNewUpdate] = useState(DEFAULT_UPDATE_FORM)
  const [editingUpdateId, setEditingUpdateId] = useState(null)
  const [editingUpdateDate, setEditingUpdateDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')

  useEffect(() => {
    const projectsRef = ref(db, 'projects')

    const unsubscribe = onValue(
      projectsRef,
      (snapshot) => {
        const data = snapshot.val()

        if (!data) {
          setProjects([])
          setIsLoading(false)
          return
        }

        const projectList = Object.keys(data)
          .map((projectId) => {
            const projectData = data[projectId]
            const updates = projectData.updates
              ? Object.keys(projectData.updates)
                  .map((updateId) => ({
                    id: updateId,
                    ...projectData.updates[updateId],
                  }))
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
              : []

            return {
              id: projectId,
              ...projectData,
              updates,
            }
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        setProjects(projectList)
        setIsLoading(false)
      },
      (error) => {
        setErrorMessage(`Gagal membaca data Firebase: ${error.message}`)
        setIsLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  )

  const filteredProjects = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()

    return projects.filter((project) => {
      const projectStatus = normalizeStatus(project.status)
      const statusMatch = statusFilter === 'all' || projectStatus === statusFilter
      const keywordMatch =
        !keyword ||
        project.title?.toLowerCase().includes(keyword) ||
        project.group?.toLowerCase().includes(keyword) ||
        project.description?.toLowerCase().includes(keyword)

      return statusMatch && keywordMatch
    })
  }, [projects, searchQuery, statusFilter])

  const dashboardStats = useMemo(() => {
    const totalLogs = projects.reduce((accumulator, project) => accumulator + project.updates.length, 0)
    const completedProjects = projects.filter(
      (project) => normalizeStatus(project.status) === 'Completed',
    ).length

    return {
      totalProjects: projects.length,
      completedProjects,
      inProgressProjects: projects.length - completedProjects,
      totalLogs,
    }
  }, [projects])

  useEffect(() => {
    if (currentView === 'detail' && !activeProject) {
      setCurrentView('dashboard')
    }
  }, [activeProject, currentView])

  const handleOpenDetail = (projectId) => {
    setActiveProjectId(projectId)
    setCurrentView('detail')
    setEditingUpdateId(null)
    setEditingUpdateDate('')
    setUploadMessage('')
  }

  const resetUpdateFormState = () => {
    setNewUpdate(DEFAULT_UPDATE_FORM)
    setEditingUpdateId(null)
    setEditingUpdateDate('')
    setUploadMessage('')
  }

  const handleAddProject = async (event) => {
    event.preventDefault()

    if (!newProject.title.trim() || !newProject.group.trim() || !newProject.description.trim()) {
      setErrorMessage('Nama proyek, kelompok, dan deskripsi wajib diisi.')
      return
    }

    try {
      const projectListRef = ref(db, 'projects')
      const newProjectRef = push(projectListRef)

      await set(newProjectRef, {
        title: newProject.title.trim(),
        group: newProject.group.trim(),
        description: newProject.description.trim(),
        components: newProject.components.trim(),
        createdAt: todayIso(),
        status: 'In Progress',
      })

      setNewProject(DEFAULT_PROJECT_FORM)
      setIsProjectModalOpen(false)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(`Gagal menyimpan proyek: ${error.message}`)
    }
  }

  const handleSaveUpdate = async (event) => {
    event.preventDefault()

    if (!newUpdate.title.trim() || !activeProjectId) {
      setErrorMessage('Judul log wajib diisi dan proyek harus dipilih terlebih dahulu.')
      return
    }

    const payload = {
      title: newUpdate.title.trim(),
      objective: newUpdate.objective.trim(),
      description: newUpdate.description.trim(),
      documentation: newUpdate.documentation.trim(),
      documentationType: newUpdate.documentationType,
      documentationName: newUpdate.documentationName,
      challenges: newUpdate.challenges.trim(),
      nextTarget: newUpdate.nextTarget.trim(),
      code: newUpdate.code,
    }

    try {
      if (editingUpdateId) {
        const existingRef = ref(db, `projects/${activeProjectId}/updates/${editingUpdateId}`)
        await update(existingRef, {
          ...payload,
          date: editingUpdateDate || todayIso(),
          updatedAt: new Date().toISOString(),
        })
      } else {
        const updatesRef = ref(db, `projects/${activeProjectId}/updates`)
        const newUpdateRef = push(updatesRef)

        await set(newUpdateRef, {
          ...payload,
          date: todayIso(),
          createdAt: new Date().toISOString(),
        })
      }

      resetUpdateFormState()
      setIsUpdateModalOpen(false)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(`Gagal menyimpan log harian: ${error.message}`)
    }
  }

  const handleStartEditUpdate = (updateItem) => {
    setErrorMessage('')
    setUploadMessage(
      updateItem.documentation
        ? 'Dokumentasi lama masih aktif. Upload ulang jika ingin mengganti dokumen.'
        : '',
    )
    setEditingUpdateId(updateItem.id)
    setEditingUpdateDate(updateItem.date || todayIso())
    setNewUpdate({
      title: updateItem.title || '',
      objective: updateItem.objective || '',
      description: updateItem.description || '',
      documentation: updateItem.documentation || '',
      documentationType: updateItem.documentationType || '',
      documentationName: updateItem.documentationName || '',
      challenges: updateItem.challenges || '',
      nextTarget: updateItem.nextTarget || '',
      code: updateItem.code || '',
    })
    setIsUpdateModalOpen(true)
  }

  const handleDeleteProject = async (projectId) => {
    const isConfirmed = window.confirm('Hapus proyek ini secara permanen? Semua log juga akan hilang.')
    if (!isConfirmed) {
      return
    }

    try {
      const projectRef = ref(db, `projects/${projectId}`)
      await remove(projectRef)

      if (activeProjectId === projectId) {
        setCurrentView('dashboard')
        setActiveProjectId(null)
      }
    } catch (error) {
      setErrorMessage(`Gagal menghapus proyek: ${error.message}`)
    }
  }

  const handleDeleteUpdate = async (updateId) => {
    if (!activeProjectId || !updateId) {
      return
    }

    const isConfirmed = window.confirm('Hapus progres ini? Tindakan ini tidak bisa dibatalkan.')
    if (!isConfirmed) {
      return
    }

    try {
      const updateRef = ref(db, `projects/${activeProjectId}/updates/${updateId}`)
      await remove(updateRef)

      if (editingUpdateId === updateId) {
        resetUpdateFormState()
        setIsUpdateModalOpen(false)
      }
    } catch (error) {
      setErrorMessage(`Gagal menghapus progres: ${error.message}`)
    }
  }

  const handleToggleProjectStatus = async () => {
    if (!activeProject) {
      return
    }

    const nextStatus = normalizeStatus(activeProject.status) === 'Completed' ? 'In Progress' : 'Completed'

    try {
      const projectRef = ref(db, `projects/${activeProject.id}`)
      await update(projectRef, {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      setErrorMessage(`Gagal mengubah status proyek: ${error.message}`)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
    if (file.size > MAX_FILE_SIZE) {
      setUploadMessage('Gagal mengunggah file: Ukuran file melebihi batas 100MB.')
      event.target.value = ''
      return
    }

    const validTypes = ['image/', 'video/', 'application/pdf']
    const isValidType = validTypes.some((t) => file.type.startsWith(t)) || file.name.toLowerCase().endsWith('.pdf')
    if (!isValidType) {
      setUploadMessage('Gagal mengunggah file: Tipe file tidak didukung. Gunakan gambar, video, atau PDF.')
      event.target.value = ''
      return
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')

    try {
      setIsUploading(true)
      setUploadMessage('')
      let publicUrl = ''

      if (uploadApiEndpoint) {
        setUploadMessage('Mengunggah file ke Cloudflare R2...')

        const objectKey = `documentation/${activeProjectId || 'umum'}/${Date.now()}-${safeFileName}`
        const formData = new FormData()
        formData.append('key', objectKey)
        formData.append('file', file, safeFileName)

        const response = await fetch(uploadApiEndpoint, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Server upload merespons dengan error ${response.status}. Coba lagi nanti.`)
        }

        const payload = await response.json()
        const resolvedPublicUrl = extractPublicUrlFromPayload(payload)

        if (!resolvedPublicUrl) {
          throw new Error('URL file tidak tersedia setelah upload. Hubungi administrator.')
        }

        publicUrl = resolvedPublicUrl
      } else {
        setUploadMessage('Mengunggah file ke Firebase Storage...')
        const objectPath = `documentation/${activeProjectId || 'umum'}/${Date.now()}-${safeFileName}`
        const docRef = storageRef(storage, objectPath)

        await uploadBytes(docRef, file, {
          contentType: file.type || 'application/octet-stream',
        })
        publicUrl = await getDownloadURL(docRef)
      }

      setNewUpdate((previous) => ({
        ...previous,
        documentation: publicUrl,
        documentationType: file.type || 'application/octet-stream',
        documentationName: file.name,
      }))

      setUploadMessage('File berhasil diunggah dan siap dipreview langsung.')
    } catch (error) {
      setUploadMessage(`Gagal mengunggah file: ${error.message}`)
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-8 text-slate-100 md:px-8 md:pt-12">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-16 h-[22rem] w-[22rem] rounded-full bg-orange-400/20 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="glass-panel rounded-3xl p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-xs font-medium tracking-[0.16em] text-cyan-100 uppercase">
                E-Logbook Praktik Hardware
              </p>
              <h1 className="text-balance text-3xl font-semibold leading-tight text-slate-50 md:text-5xl">
                Jurnal Proyek Arduino
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 md:text-base">
                Platform resmi e-logbook pembelajaran untuk dokumentasi progres, kendala, kode, dan berkas proyek Arduino secara terstruktur, kolaboratif, dan real-time antara siswa dan guru.
              </p>
            </div>

            {currentView === 'dashboard' && (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] hover:shadow-lg hover:shadow-cyan-500/30"
                onClick={() => {
                  setErrorMessage('')
                  setNewProject(DEFAULT_PROJECT_FORM)
                  setIsProjectModalOpen(true)
                }}
              >
                <Plus size={17} />
                Buat Proyek Baru
              </button>
            )}
          </div>
        </header>

        {errorMessage && (
          <section className="glass-panel rounded-2xl border border-rose-300/50 bg-rose-400/10 p-4 text-sm text-rose-100">
            {errorMessage}
          </section>
        )}

        {currentView === 'dashboard' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-100 md:text-2xl">Dashboard Proyek Kelas</h2>
              <p className="text-xs tracking-wide text-slate-300 uppercase md:text-sm">
                Tampil {filteredProjects.length} dari {projects.length} proyek
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <article className="glass-panel rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Total Proyek</p>
                <p className="mt-1 text-2xl font-semibold text-white">{dashboardStats.totalProjects}</p>
              </article>
              <article className="glass-panel rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Sedang Berjalan</p>
                <p className="mt-1 text-2xl font-semibold text-amber-200">{dashboardStats.inProgressProjects}</p>
              </article>
              <article className="glass-panel rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Selesai</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-200">{dashboardStats.completedProjects}</p>
              </article>
              <article className="glass-panel rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Total Progres Log</p>
                <p className="mt-1 text-2xl font-semibold text-cyan-100">{dashboardStats.totalLogs}</p>
              </article>
            </div>

            <div className="glass-panel grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_auto] md:items-center">
              <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-slate-950/30 px-3 py-2">
                <Search size={15} className="text-slate-300" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari judul proyek, kelompok, atau deskripsi"
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400"
                />
              </label>

              <div className="inline-flex flex-wrap items-center gap-2">
                {['all', 'In Progress', 'Completed'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setStatusFilter(item)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      statusFilter === item
                        ? 'border-cyan-200/60 bg-cyan-300/20 text-cyan-100'
                        : 'border-white/20 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {item === 'all' ? 'Semua Status' : item}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="glass-panel rounded-3xl p-10 text-center text-slate-300">
                Mengambil data proyek dari Firebase...
              </div>
            ) : projects.length === 0 ? (
              <div className="glass-panel rounded-3xl border border-dashed border-white/20 p-12 text-center">
                <ClipboardList className="mx-auto mb-4 text-slate-300" size={34} />
                <h3 className="mb-2 text-xl font-semibold text-slate-100">Belum ada proyek</h3>
                <p className="mx-auto mb-6 max-w-xl text-sm text-slate-300 md:text-base">
                  Mulai dengan membuat proyek pertama. Setelah itu setiap log pertemuan akan muncul otomatis di timeline.
                </p>
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-100"
                >
                  <Plus size={16} />
                  Tambah Proyek
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="glass-panel rounded-3xl border border-dashed border-white/20 p-10 text-center text-slate-300">
                Tidak ada proyek yang cocok dengan kata kunci atau filter status.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => (
                  <article
                    key={project.id}
                    className="glass-panel slide-up group flex min-h-64 cursor-pointer flex-col rounded-3xl p-5 transition hover:-translate-y-1"
                    onClick={() => handleOpenDetail(project.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleOpenDetail(project.id)
                      }
                    }}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p
                          className={`text-xs tracking-[0.18em] uppercase ${
                            normalizeStatus(project.status) === 'Completed'
                              ? 'text-emerald-200'
                              : 'text-amber-200'
                          }`}
                        >
                          {normalizeStatus(project.status)}
                        </p>
                        <h3 className="line-clamp-2 text-xl leading-tight font-semibold text-slate-50">{project.title}</h3>
                      </div>
                      <button
                        type="button"
                        className="rounded-xl border border-rose-200/30 p-2 text-rose-200 transition hover:border-rose-200/70 hover:text-rose-100"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDeleteProject(project.id)
                        }}
                        aria-label="Hapus proyek"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mb-4 flex items-center gap-2 text-xs text-slate-300">
                      <Users size={14} />
                      <span>{project.group}</span>
                    </div>

                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-200/90">{project.description}</p>

                    <div className="mt-auto space-y-3 pt-6">
                      <div className="flex items-center justify-between text-xs text-slate-300 md:text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <ClipboardList size={14} />
                          {project.updates.length} log
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          {toDateLabel(project.createdAt)}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm font-medium text-cyan-100 transition group-hover:translate-x-1">
                        Buka Detail
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {currentView === 'detail' && activeProject && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentView('dashboard')}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
                >
                  <ArrowLeft size={15} />
                  Kembali ke Dashboard
                </button>

                <button
                  type="button"
                  onClick={handleToggleProjectStatus}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    normalizeStatus(activeProject.status) === 'Completed'
                      ? 'bg-emerald-300 text-slate-950 hover:bg-emerald-200'
                      : 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                  }`}
                >
                  {normalizeStatus(activeProject.status) === 'Completed' ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <Clock3 size={15} />
                  )}
                  {normalizeStatus(activeProject.status) === 'Completed'
                    ? 'Tandai Berjalan Lagi'
                    : 'Tandai Selesai'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage('')
                  resetUpdateFormState()
                  setIsUpdateModalOpen(true)
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-300 to-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:scale-[1.01]"
              >
                <Plus size={15} />
                Tambah Log Harian
              </button>
            </div>

            <article className="glass-panel rounded-3xl p-6 md:p-8">
              <h2 className="mb-3 text-2xl font-semibold text-slate-50 md:text-3xl">{activeProject.title}</h2>
              <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                <p className="inline-flex items-center gap-2">
                  <Users size={14} />
                  {activeProject.group}
                </p>
                <p className="inline-flex items-center gap-2">
                  <CalendarDays size={14} />
                  Mulai: {toDateLabel(activeProject.createdAt)}
                </p>
                <p
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                    normalizeStatus(activeProject.status) === 'Completed'
                      ? 'border-emerald-200/40 bg-emerald-300/20 text-emerald-100'
                      : 'border-amber-200/40 bg-amber-300/20 text-amber-100'
                  }`}
                >
                  {normalizeStatus(activeProject.status)}
                </p>
              </div>

              <p className="mb-4 text-sm leading-relaxed text-slate-200 md:text-base">{activeProject.description}</p>

              <div className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
                <p className="mb-2 inline-flex items-center gap-2 font-semibold">
                  <Cpu size={15} />
                  Komponen Utama
                </p>
                <p className="leading-relaxed text-cyan-100/90">
                  {activeProject.components || 'Belum diisi oleh kelompok.'}
                </p>
              </div>
            </article>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-100 md:text-2xl">Timeline Progres Kelompok</h3>

              {activeProject.updates.length === 0 ? (
                <div className="glass-panel rounded-3xl border border-dashed border-white/20 p-8 text-center text-slate-300">
                  Belum ada log harian. Klik Tambah Log Harian untuk mencatat progres pertemuan pertama.
                </div>
              ) : (
                <div className="relative space-y-4 pl-5 before:absolute before:left-1.5 before:top-1 before:h-[calc(100%-0.5rem)] before:w-px before:bg-gradient-to-b before:from-cyan-300 before:to-orange-200">
                  {activeProject.updates.map((update) => (
                    <article key={update.id} className="glass-panel slide-up relative rounded-3xl p-5 md:p-6">
                      <span className="absolute -left-[1.68rem] top-7 h-3 w-3 rounded-full border-2 border-slate-900 bg-cyan-300" />
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h4 className="text-lg font-semibold text-slate-50 md:text-xl">{update.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                            {toDateLabel(update.date)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEditUpdate(update)}
                            className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-slate-100 transition hover:bg-white/20"
                          >
                            <FilePenLine size={12} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUpdate(update.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-200/35 bg-rose-400/10 px-3 py-1 text-xs text-rose-100 transition hover:bg-rose-400/20"
                          >
                            <Trash2 size={12} />
                            Hapus
                          </button>
                        </div>
                      </div>

                      <div className="mb-4 grid gap-2 md:grid-cols-2">
                        <p className="badge badge-blue">
                          <Target size={14} />
                          <span className="font-medium">Tujuan:</span>
                          {update.objective || '-'}
                        </p>
                        <p className="badge badge-amber">
                          <CircleAlert size={14} />
                          <span className="font-medium">Kendala:</span>
                          {update.challenges || '-'}
                        </p>
                        <p className="badge badge-purple md:col-span-2">
                          <Wrench size={14} />
                          <span className="font-medium">Target Berikutnya:</span>
                          {update.nextTarget || '-'}
                        </p>
                      </div>

                      <p className="mb-4 text-sm leading-relaxed text-slate-200 md:text-base">{update.description || '-'}</p>

                      {update.documentation && <DocumentationPreview item={update} />}

                      {update.code && (
                        <div>
                          <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-100">
                            <Code2 size={15} />
                            Potongan Kode Arduino
                          </p>
                          <SyntaxHighlighter
                            language="cpp"
                            style={oneDark}
                            customStyle={{
                              borderRadius: '14px',
                              margin: 0,
                              fontSize: '0.85rem',
                            }}
                            wrapLongLines
                          >
                            {update.code}
                          </SyntaxHighlighter>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Buat Proyek Baru"
      >
        <form className="grid gap-4" onSubmit={handleAddProject}>
          <label className="field-label">
            Nama Kelompok dan Kelas *
            <input
              type="text"
              value={newProject.group}
              onChange={(event) =>
                setNewProject((prev) => ({
                  ...prev,
                  group: event.target.value,
                }))
              }
              className="field-input"
              placeholder="Contoh: Kelas 11 IPA 1 - Kelompok 3"
              required
            />
          </label>

          <label className="field-label">
            Nama Proyek *
            <input
              type="text"
              value={newProject.title}
              onChange={(event) =>
                setNewProject((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
              className="field-input"
              placeholder="Contoh: Tempat Sampah Pintar"
              required
            />
          </label>

          <label className="field-label">
            Deskripsi Singkat *
            <textarea
              value={newProject.description}
              onChange={(event) =>
                setNewProject((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className="field-input min-h-24"
              placeholder="Tuliskan ringkasan tujuan proyek..."
              required
            />
          </label>

          <label className="field-label">
            Daftar Komponen (Opsional)
            <textarea
              value={newProject.components}
              onChange={(event) =>
                setNewProject((prev) => ({
                  ...prev,
                  components: event.target.value,
                }))
              }
              className="field-input min-h-20"
              placeholder="Contoh: Arduino Uno, Sensor Ultrasonik, Servo, Breadboard"
            />
          </label>

          <div className="mt-3 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="rounded-xl border border-white/25 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200"
            >
              Simpan Proyek
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false)
          resetUpdateFormState()
        }}
        title={editingUpdateId ? 'Edit Log Harian' : 'Tambah Log Harian'}
        maxWidth="max-w-4xl"
      >
        <form className="grid gap-4" onSubmit={handleSaveUpdate}>
          <label className="field-label">
            Judul Pekerjaan Hari Ini *
            <input
              type="text"
              value={newUpdate.title}
              onChange={(event) =>
                setNewUpdate((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
              className="field-input"
              placeholder="Contoh: Pertemuan 2 - Kalibrasi Sensor"
              required
            />
          </label>

          <label className="field-label">
            Tujuan Pertemuan
            <input
              type="text"
              value={newUpdate.objective}
              onChange={(event) =>
                setNewUpdate((prev) => ({
                  ...prev,
                  objective: event.target.value,
                }))
              }
              className="field-input"
              placeholder="Contoh: Membaca jarak secara stabil"
            />
          </label>

          <label className="field-label">
            Progres Detail
            <textarea
              value={newUpdate.description}
              onChange={(event) =>
                setNewUpdate((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className="field-input min-h-24"
              placeholder="Tuliskan apa yang sudah berhasil dirakit/diuji hari ini..."
            />
          </label>

          <div className="grid gap-3">
            <p className="text-sm text-slate-200">
              Dokumentasi diisi melalui upload berkas agar bisa direview langsung oleh guru.
            </p>
            <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-200/35 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/20 sm:w-auto">
              <UploadCloud size={15} />
              {isUploading ? 'Mengunggah...' : 'Upload Berkas'}
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,video/*,.pdf"
                disabled={isUploading}
              />
            </label>

            {newUpdate.documentation && (
              <div className="w-full overflow-hidden rounded-xl border border-white/15 bg-slate-900/40 p-3">
                <DocumentationPreview item={newUpdate} />
                <button
                  type="button"
                  onClick={() =>
                    setNewUpdate((previous) => ({
                      ...previous,
                      documentation: '',
                      documentationType: '',
                      documentationName: '',
                    }))
                  }
                  className="mt-3 inline-flex items-center gap-1 rounded-lg border border-rose-200/35 bg-rose-400/10 px-3 py-1 text-xs text-rose-100 transition hover:bg-rose-400/20"
                >
                  <Trash2 size={12} />
                  Hapus Dokumentasi dari Log
                </button>
              </div>
            )}
          </div>

          {uploadMessage && <p className="text-xs text-cyan-100 md:text-sm">{uploadMessage}</p>}

          <label className="field-label">
            Kendala atau Masalah
            <textarea
              value={newUpdate.challenges}
              onChange={(event) =>
                setNewUpdate((prev) => ({
                  ...prev,
                  challenges: event.target.value,
                }))
              }
              className="field-input min-h-20"
              placeholder="Tulis kendala komponen, wiring, atau logika program"
            />
          </label>

          <label className="field-label">
            Target Pertemuan Berikutnya
            <textarea
              value={newUpdate.nextTarget}
              onChange={(event) =>
                setNewUpdate((prev) => ({
                  ...prev,
                  nextTarget: event.target.value,
                }))
              }
              className="field-input min-h-20"
              placeholder="Contoh: Integrasi sensor dengan servo dan buzzer"
            />
          </label>

          <label className="field-label">
            Potongan Kode (Opsional)
            <textarea
              value={newUpdate.code}
              onChange={(event) =>
                setNewUpdate((prev) => ({
                  ...prev,
                  code: event.target.value,
                }))
              }
              className="field-input code-field"
              placeholder="void setup() {\n  Serial.begin(9600);\n}"
            />
          </label>

          <div className="mt-3 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsUpdateModalOpen(false)
                resetUpdateFormState()
              }}
              className="rounded-xl border border-white/25 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-orange-300 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-orange-200"
            >
              {editingUpdateId ? 'Simpan Perubahan' : 'Simpan Log Harian'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default App
