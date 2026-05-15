import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, FolderKanban, Globe, ChevronRight, 
  Search, Filter, Activity, Shield, Users, 
  ExternalLink, LayoutGrid, List, AlertTriangle,
  GitBranch, Terminal, ShieldCheck
} from 'lucide-react';
import { createProject } from '../api/projects';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import useProjects from '../hooks/useProjects';
import useToast from '../hooks/useToast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const ProjectsPage = () => {
  useDocumentTitle('Projects');
  const { projects, loading, error, refresh } = useProjects();
  const { success, error: toastError } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const [form, setForm] = useState({
    name: '',
    repoUrl: '',
    description: '',
    defaultBranch: 'main',
    stagingUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.repoUrl.trim()) {
      toastError('Name and repository URL are required.');
      return;
    }
    setSaving(true);
    try {
      await createProject({
        name: form.name.trim(),
        repoUrl: form.repoUrl.trim(),
        description: form.description.trim(),
        defaultBranch: form.defaultBranch.trim() || 'main',
        stagingUrl: form.stagingUrl.trim(),
      });
      setForm({ name: '', repoUrl: '', description: '', defaultBranch: 'main', stagingUrl: '' });
      setShowCreate(false);
      success('Project initialized successfully');
      await refresh();
    } catch (err) {
      toastError(err.response?.data?.message ?? 'Failed to initialize project.');
    } finally {
      setSaving(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.repoUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-blue font-bold text-xs uppercase tracking-widest">
            <FolderKanban size={14} />
            Workspace
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Project Registry</h1>
          <p className="text-text-muted text-sm max-w-lg font-medium">
            Manage your secure software supply chain. Monitor repositories, enforce gate policies, and coordinate security reviews.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate((prev) => !prev)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-xl
              ${showCreate 
                ? 'bg-bg-elevated border border-border-main text-text-primary hover:bg-bg-hover' 
                : 'bg-brand-blue text-white shadow-brand-blue/20 hover:shadow-brand-blue/30'}
            `}
          >
            {showCreate ? <X size={18} /> : <Plus size={18} />}
            {showCreate ? 'Close Portal' : 'Register Repository'}
          </motion.button>
        </div>
      </header>

      {/* Create Project Portal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="relative z-20"
          >
            <Card className="border-brand-blue/30 shadow-2xl shadow-brand-blue/10 overflow-visible bg-gradient-to-br from-bg-card to-bg-elevated">
              {/* Decorative accent */}
              <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-1 bg-brand-blue rounded-full shadow-[0_0_15px_rgba(79,163,255,0.5)]" />
              
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
                  <Terminal size={18} />
                </div>
                <h3 className="text-lg font-black text-text-primary tracking-tight">Repository Initialization</h3>
              </div>

              <form onSubmit={submitCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Project Identity</label>
                    <input
                      value={form.name}
                      onChange={setField('name')}
                      placeholder="e.g. Core Auth API"
                      className="w-full bg-bg-card border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-brand-blue/50 transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Source Control URL</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        value={form.repoUrl}
                        onChange={setField('repoUrl')}
                        placeholder="github.com/organization/repository"
                        className="w-full bg-bg-card border border-border-main rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-brand-blue/50 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Operational Brief</label>
                  <textarea
                    value={form.description}
                    onChange={setField('description')}
                    placeholder="Provide a high-level summary of the software scope and deployment target..."
                    className="w-full bg-bg-card border border-border-main rounded-xl px-4 py-3 text-sm font-medium text-text-primary outline-none focus:border-brand-blue/50 transition-all shadow-inner h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Telemetry Branch</label>
                    <div className="relative">
                      <GitBranch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        value={form.defaultBranch}
                        onChange={setField('defaultBranch')}
                        placeholder="main"
                        className="w-full bg-bg-card border border-border-main rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-brand-blue/50 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Environment Target (Optional)</label>
                    <input
                      value={form.stagingUrl}
                      onChange={setField('stagingUrl')}
                      placeholder="https://staging.services.internal"
                      className="w-full bg-bg-card border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-brand-blue/50 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-brand-blue text-white rounded-xl text-sm font-black shadow-lg shadow-brand-blue/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Activity size={18} className="animate-spin" />}
                    {saving ? 'PROVISIONING...' : 'INITIALIZE REGISTRY'}
                  </motion.button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative group w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-blue transition-colors" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Project Registry..."
            className="w-full bg-bg-card border border-border-main rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-brand-blue/30 focus:shadow-lg focus:shadow-brand-blue/5 transition-all shadow-xl shadow-black/10"
          />
        </div>
        
        <div className="flex items-center bg-bg-card border border-border-main rounded-2xl p-1.5 shadow-xl shadow-black/10">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-bg-elevated text-brand-blue shadow-inner' : 'text-text-muted hover:text-text-primary'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-bg-elevated text-brand-blue shadow-inner' : 'text-text-muted hover:text-text-primary'}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 shadow-lg shadow-brand-red/5">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Projects Display */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="h-48">
              <Skeleton className="w-1/3 h-4 mb-6" />
              <Skeleton className="w-2/3 h-6 mb-4" />
              <Skeleton className="w-full h-12" />
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-32 flex flex-col items-center text-center space-y-4 bg-bg-card/30 rounded-3xl border-2 border-dashed border-border-main/50">
          <div className="p-6 bg-bg-elevated rounded-3xl border border-border-main text-text-muted/20">
            <FolderKanban size={64} />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-primary tracking-tight">Project Registry Empty</h3>
            <p className="text-sm text-text-muted font-medium mt-1">No repositories found matching your current parameters.</p>
          </div>
          {!searchQuery && (
            <button 
              onClick={() => setShowCreate(true)}
              className="px-6 py-2.5 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-blue/20 transition-all"
            >
              Start First Scan
            </button>
          )}
        </div>
      ) : (
        <motion.div 
          variants={container} 
          initial="hidden" 
          animate="show"
          className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
        >
          {filteredProjects.map((p) => (
            viewMode === 'grid' ? (
              <Card key={p._id} className="group hover:border-brand-blue/40 transition-all duration-500">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-bg-elevated border border-border-main rounded-2xl group-hover:scale-110 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-all duration-500">
                      <Activity size={24} strokeWidth={2.5} />
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      p.gateConfig?.mode === 'block' ? 'bg-brand-red/10 border-brand-red/20 text-brand-red' : 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue'
                    }`}>
                      {p.gateConfig?.mode ?? 'block'}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-black text-text-primary tracking-tight group-hover:text-brand-blue transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-text-muted font-medium line-clamp-2 leading-relaxed">
                      {p.description || 'Continuous security monitoring for this repository.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border-main/50 space-y-4">
                    <div className="flex items-center gap-3 text-text-muted">
                      <Globe size={14} className="opacity-50" />
                      <span className="text-[11px] font-bold font-mono truncate">{p.repoUrl.replace('https://', '')}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[1, 2].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full bg-bg-elevated border-2 border-bg-card flex items-center justify-center text-[8px] font-black text-text-muted">
                            <Users size={10} />
                          </div>
                        ))}
                      </div>
                      <Link 
                        to={`/projects/${p._id}`}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-brand-blue hover:gap-3 transition-all"
                      >
                        ANALYZE <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card key={p._id} className="p-0 overflow-hidden hover:border-brand-blue/40 transition-all duration-500">
                <div className="flex items-center gap-6 p-4">
                  <div className="p-3 bg-bg-elevated border border-border-main rounded-2xl text-text-muted shrink-0 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-colors">
                    <FolderKanban size={24} />
                  </div>
                  
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="col-span-1 md:col-span-1 min-w-0">
                      <h3 className="text-sm font-black text-text-primary tracking-tight truncate uppercase tracking-widest">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Globe size={12} className="text-text-muted shrink-0" />
                        <span className="text-[10px] text-text-muted font-bold truncate">{p.repoUrl.replace('https://', '')}</span>
                      </div>
                    </div>
                    
                    <div className="hidden md:block col-span-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.gateConfig?.mode === 'block' ? 'bg-brand-red' : 'bg-brand-blue'}`} />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">GATE: {p.gateConfig?.mode ?? 'block'}</span>
                      </div>
                    </div>

                    <div className="hidden md:flex flex-col items-center col-span-1">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Pass Threshold</p>
                      <p className="text-sm font-black text-text-primary leading-none">{p.gateConfig?.threshold ?? 70}%</p>
                    </div>

                    <div className="flex justify-end col-span-1">
                      <Link 
                        to={`/projects/${p._id}`}
                        className="bg-bg-elevated border border-border-main px-4 py-2 rounded-xl text-[10px] font-black text-text-primary hover:text-brand-blue hover:border-brand-blue/50 transition-all uppercase tracking-widest shadow-lg shadow-black/10"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            )
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ProjectsPage;
