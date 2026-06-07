import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, X, FolderKanban, Globe, ChevronRight, Code2, GitBranch, LayoutGrid } from 'lucide-react';
import { createProject } from '../api/projects';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import useProjects from '../hooks/useProjects';
import useToast from '../hooks/useToast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const tableCell = {
  padding: '16px 16px',
  borderBottom: '1px solid var(--border-subtle)',
  fontSize: 13,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

/** Staggered entry animation for table rows */
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } }
};

const ProjectsPage = () => {
  useDocumentTitle('Projects');
  const { projects, loading, error, refresh } = useProjects();
  const { success, error: toastError } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    repoUrl: '',
    description: '',
    defaultBranch: 'main',
    stagingUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const contentRef = useRef(null);

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
      success('Project created successfully');
      await refresh();
    } catch (err) {
      toastError(err.response?.data?.message ?? 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 14, 
            background: 'var(--blue-dim)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(79, 163, 255, 0.2)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            <FolderKanban size={24} color="var(--blue)" strokeWidth={2} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Projects</h2>
            <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
              Manage repositories and gate configurations
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate((prev) => !prev)}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: showCreate ? 'var(--bg-elevated)' : 'var(--blue)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background 0.2s',
            boxShadow: showCreate ? 'none' : '0 4px 12px rgba(79, 163, 255, 0.3)'
          }}
        >
          {showCreate ? <X size={18} /> : <Plus size={18} />}
          {showCreate ? 'Cancel' : 'New Project'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div 
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: contentRef.current?.scrollHeight || 'auto' }}
              exit={{ height: 0 }}
              transition={{
                height: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  mass: 1
                }
              }}
              style={{ overflow: 'hidden' }}
            >
              <div ref={contentRef}>
                <Card style={{ border: '1px solid var(--blue)', boxShadow: '0 0 20px rgba(79, 163, 255, 0.1)', marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600, textTransform: 'uppercase' }}>Create New Project</div>
              <form onSubmit={submitCreate} style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>PROJECT NAME</label>
                    <input
                      value={form.name}
                      onChange={setField('name')}
                      placeholder="e.g. Authentication Service"
                      style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>REPOSITORY URL</label>
                    <input
                      value={form.repoUrl}
                      onChange={setField('repoUrl')}
                      placeholder="https://github.com/org/repo"
                      style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>DESCRIPTION</label>
                  <textarea
                    value={form.description}
                    onChange={setField('description')}
                    placeholder="Briefly describe the purpose of this project..."
                    style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none', resize: 'none', height: 80 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>DEFAULT BRANCH</label>
                    <input
                      value={form.defaultBranch}
                      onChange={setField('defaultBranch')}
                      placeholder="main"
                      style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>STAGING URL (optional)</label>
                    <input
                      value={form.stagingUrl}
                      onChange={setField('stagingUrl')}
                      placeholder="https://staging.app.com"
                      style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '12px 32px',
                      borderRadius: 12,
                      border: 'none',
                      background: 'var(--blue)',
                      color: '#fff',
                      fontSize: 14,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {saving ? 'Creating Project...' : 'Initialize Project'}
                  </button>
                </div>
              </form>
            </Card>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
          {error}
        </div>
      )}

      <motion.div variants={container} initial="hidden" animate="show">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '24px' }}>
              {[1, 2, 3].map(i => <Skeleton key={i} height={60} style={{ marginBottom: 12 }} />)}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ padding: '80px 24px', textAlign: 'center' }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 24, 
                background: 'var(--bg-elevated)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
              }}>
                <LayoutGrid size={40} color="var(--text-muted)" style={{ opacity: 0.3 }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>No projects found</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, maxWidth: 320, margin: '8px auto 0' }}>
                Initialize your first project to start automated security scans and policy enforcement.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-elevated)', textAlign: 'left' }}>
                  <tr>
                    <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project</th>
                    <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Repository</th>
                    <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gate Mode</th>
                    <th style={{ ...tableCell, color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={tableCell}></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <motion.tr 
                      key={p._id} 
                      variants={listItem}
                      style={{ transition: 'background 0.2s' }} 
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} 
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={tableCell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 10, 
                            background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '1px solid var(--border)',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                          }}>
                            <Code2 size={18} color="var(--blue)" strokeWidth={2} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || 'No description provided'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <GitBranch size={14} style={{ color: 'var(--purple)', opacity: 0.8 }} />
                          <span className="font-mono" style={{ fontSize: 12 }}>{p.repoUrl.replace('https://', '')}</span>
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, background: p.gateConfig?.mode === 'block' ? 'var(--red-dim)' : 'var(--blue-dim)', color: p.gateConfig?.mode === 'block' ? 'var(--red)' : 'var(--blue)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                          {p.gateConfig?.mode ?? 'block'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Score Threshold: {p.gateConfig?.threshold ?? 70}</div>
                      </td>
                      <td style={tableCell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }}></div>
                          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>Active</div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Last activity: {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}</div>
                      </td>
                      <td style={{ ...tableCell, textAlign: 'right' }}>
                        <Link 
                          to={`/projects/${p._id}`} 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 6, 
                            padding: '8px 16px', 
                            borderRadius: 12, 
                            background: 'var(--bg-elevated)', 
                            color: 'var(--text-primary)', 
                            textDecoration: 'none', 
                            fontWeight: 600, 
                            fontSize: 13,
                            border: '1px solid var(--border)',
                            transition: 'all 0.2s'
                          }}
                        >
                          Manage <ChevronRight size={14} />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ProjectsPage;
