import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  ChevronRight,
  GitBranch,
  AlertTriangle,
  Zap,
  Brain,
  ArrowRight,
  CheckCircle,
  Mail,
  Globe,
  LucideGitBranch,
  Menu,
  X
} from 'lucide-react';
import useToast from '../hooks/useToast';
import Card from '../components/ui/Card';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Shared nav
const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(15,17,23,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
      }} className="navbar-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div 
            whileHover={{ rotate: 10 }}
            style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--blue), var(--purple))',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79, 163, 255, 0.2)'
            }}>
            <Shield size={20} color="#fff" strokeWidth={2.5} />
          </motion.div>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>SecOps Platform</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="hide-on-mobile" style={{ display: 'flex', gap: 4, marginRight: 16 }}>
            {['Features', 'How it Works', 'About', 'Contact'].map(label => (
              <a key={label} href={`#${label.toLowerCase().replace(/ /g, '-')}`} style={{
                padding: '8px 12px', fontSize: 14, color: 'var(--text-muted)',
                textDecoration: 'none', borderRadius: 8, fontWeight: 500,
                transition: 'all 0.2s'
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >{label}</a>
            ))}
          </div>
          <Link to="/login" className="hide-on-mobile" style={{
            padding: '8px 18px', fontSize: 14, fontWeight: 600,
            color: 'var(--text-primary)', textDecoration: 'none', borderRadius: 10,
            border: '1px solid var(--border)',
            transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-dim)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
          >Login</Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hide-on-mobile">
            <Link to="/register" style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 700,
              background: 'var(--blue)', color: '#fff', textDecoration: 'none',
              borderRadius: 10, boxShadow: '0 4px 14px rgba(79, 163, 255, 0.3)'
            }}>Get Started</Link>
          </motion.div>
          
          <button 
            className="show-on-mobile"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ 
              background: 'var(--bg-elevated)', border: '1px solid var(--border)', 
              color: 'var(--text-muted)', borderRadius: 8, padding: 8, cursor: 'pointer',
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="show-on-mobile" style={{
          position: 'fixed', top: 64, left: 0, right: 0, background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)', padding: '16px 24px', zIndex: 99,
          flexDirection: 'column', gap: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          {['Features', 'How it Works', 'About', 'Contact'].map(label => (
            <a key={label} href={`#${label.toLowerCase().replace(/ /g, '-')}`} onClick={() => setMobileMenuOpen(false)} style={{
              fontSize: 16, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600,
              padding: '8px 0', borderBottom: '1px solid var(--border-subtle)'
            }}>
              {label}
            </a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <Link to="/login" style={{ padding: '12px', textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ padding: '12px', textAlign: 'center', fontSize: 15, fontWeight: 700, background: 'var(--blue)', color: '#fff', borderRadius: 10, textDecoration: 'none' }}>Get Started</Link>
          </div>
        </div>
      )}
    </>
  );
};

// Hero 
const Hero = () => (
  <section style={{
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', padding: '120px 24px 80px',
    position: 'relative', overflow: 'hidden',
  }}>
    {/* Animated background glows */}
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3]
      }}
      transition={{ duration: 8, repeat: Infinity }}
      style={{
        position: 'absolute', top: '10%', left: '30%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--blue-dim) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} 
    />
    <motion.div 
      animate={{ 
        scale: [1.2, 1, 1.2],
        opacity: [0.2, 0.4, 0.2]
      }}
      transition={{ duration: 10, repeat: Infinity }}
      style={{
        position: 'absolute', bottom: '10%', right: '20%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--purple-dim) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
      }} 
    />

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '8px 16px', borderRadius: 100,
        border: '1px solid var(--border)',
        background: 'rgba(29, 45, 61, 0.5)',
        backdropFilter: 'blur(10px)',
        fontSize: 13, color: 'var(--blue)', marginBottom: 32,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px'
      }}>
        <motion.span 
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} 
        />
        Cloud-Native DevSecOps
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: 'clamp(2.8rem, 8vw, 4.5rem)',
        fontWeight: 900, lineHeight: 1,
        color: 'var(--text-primary)', margin: '0 0 28px',
        maxWidth: 900, letterSpacing: '-2px'
      }}>
        The Future of <br />
        <span style={{
          background: 'linear-gradient(90deg, var(--blue), var(--purple), var(--blue))',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Secure Deployment.</span>
      </h1>

      <p style={{
        fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)', maxWidth: 650,
        margin: '0 auto 48px', lineHeight: 1.6,
      }}>
        Empower your engineering teams with automated static, dynamic, and dependency analysis. 
        Gate releases using advanced ML risk intelligence.
      </p>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 36px', borderRadius: 14,
            background: 'var(--blue)',
            color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 700,
            boxShadow: '0 8px 30px rgba(79, 163, 255, 0.4)',
          }}>
            Launch Your First Pipeline <ArrowRight size={18} />
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <a href="#how-it-works" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 36px', borderRadius: 14,
            border: '1px solid var(--border)', background: 'rgba(22, 32, 42, 0.6)',
            backdropFilter: 'blur(10px)',
            color: 'var(--text-primary)', textDecoration: 'none', fontSize: 16, fontWeight: 600
          }}>
            Technical Demo <Zap size={18} fill="currentColor" />
          </a>
        </motion.div>
      </div>
    </motion.div>

    {/* Pipeline Visualizer */}
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 1 }}
      style={{
        marginTop: 80, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
        padding: '24px', background: 'rgba(29, 45, 61, 0.3)', borderRadius: 20,
        border: '1px solid var(--border)'
      }}
    >
      {[
        { label: 'Source', icon: GitBranch, color: 'var(--blue)' },
        { label: 'SAST', icon: Shield, color: 'var(--orange)' },
        { label: 'SCA', icon: Shield, color: 'var(--orange)' },
        { label: 'DAST', icon: Shield, color: 'var(--red)' },
        { label: 'ML Score', icon: Brain, color: 'var(--purple)' },
        { label: 'Approved', icon: CheckCircle, color: 'var(--green)' },
      ].map((step, i) => (
        <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + (i * 0.1) }}
            style={{
              padding: '10px 16px', borderRadius: 12,
              background: 'var(--bg-card)', border: `1px solid ${step.color}44`,
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 14, fontWeight: 700, color: step.color,
              boxShadow: `0 4px 12px ${step.color}11`
            }}
          >
            <step.icon size={16} />
            {step.label}
          </motion.div>
          {i < 5 && (
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              style={{ width: 24, height: 2, background: 'var(--border)' }} 
            />
          )}
        </div>
      ))}
    </motion.div>
  </section>
);

// Features
const features = [
  {
    icon: GitBranch, color: 'var(--blue)',
    title: 'Static Analysis (SAST)',
    desc: 'Powered by SonarQube. Depth-first vulnerability research covering OWASP Top 10 and SANS 25 risks.',
  },
  {
    icon: AlertTriangle, color: 'var(--orange)',
    title: 'Composition Analysis (SCA)',
    desc: 'Automated dependency graph analysis. Identify vulnerable libraries and transitive risks in real-time.',
  },
  {
    icon: Zap, color: 'var(--red)',
    title: 'Dynamic Scanning (DAST)',
    desc: 'Active runtime security probing. Simulate sophisticated attacks against staging endpoints automatically.',
  },
  {
    icon: Brain, color: 'var(--purple)',
    title: 'ML Decision Engine',
    desc: 'Proprietary risk modeling that weights findings across all scanners to automate deployment gating.',
  },
];

const Features = () => (
  <section id="features" style={{ padding: '120px 48px', maxWidth: 1200, margin: '0 auto' }}>
    <motion.div 
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      variants={stagger}
      style={{ textAlign: 'center', marginBottom: 80 }}
    >
      <motion.div variants={fadeIn} style={{ fontSize: 14, color: 'var(--blue)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
        Advanced Protection
      </motion.div>
      <motion.h2 variants={fadeIn} style={{ fontSize: 'clamp(2.2rem, 5vw, 3rem)', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-1px' }}>
        Automate your entire security stack
      </motion.h2>
    </motion.div>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
      {features.map(({ icon: Icon, color, title, desc }) => (
        <motion.div 
          key={title}
          whileHover={{ y: -8 }}
          style={{
            padding: '32px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 20, position: 'relative', overflow: 'hidden'
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `${color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
            border: `1px solid ${color}33`
          }}>
            <Icon size={24} color={color} />
          </div>
          <h3 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at bottom right, ${color}11, transparent 70%)` }} />
        </motion.div>
      ))}
    </div>
  </section>
);

// How it Works
const steps = [
  { num: '01', title: 'Webhook Activation', desc: 'Securely link GitHub via HMAC-SHA256 verified webhooks. Every push triggers an immediate security workflow orchestration.' },
  { num: '02', title: 'Containerized Analysis', desc: 'Parallel scan engines spin up in isolated environments. SAST, SCA, and DAST tools perform deep inspection simultaneously.' },
  { num: '03', title: 'Intelligent Gating', desc: 'The ML engine evaluates findings against project policies. Approved commits flow to staging; risky code is blocked automatically.' },
];

const HowItWorks = () => (
  <section id="how-it-works" style={{
    padding: '120px 48px',
    background: 'var(--bg-elevated)',
    borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
  }}>
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 80 }}>
        <div style={{ fontSize: 14, color: 'var(--green)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
          Pipeline Flow
        </div>
        <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3rem)', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-1px' }}>
          Visibility at every stage
        </h2>
      </div>
      <div style={{ display: 'grid', gap: 32 }}>
        {steps.map((s, i) => (
          <motion.div 
            key={s.num}
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={i % 2 === 0 ? "flex-col-mobile" : "flex-col-mobile"}
            style={{
              display: 'flex', gap: 32, alignItems: 'center',
              padding: '40px', background: 'var(--bg-card)',
              borderRadius: 24, border: '1px solid var(--border)',
              flexDirection: i % 2 === 0 ? 'row' : 'row-reverse',
              textAlign: 'left'
            }}
          >
            <div style={{
              fontSize: 64, fontWeight: 900, color: 'var(--blue)',
              fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, lineHeight: 1,
              opacity: 0.4
            }}>{s.num}</div>
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{s.title}</h3>
              <p style={{ margin: 0, fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// About
const techStack = ['React 19', 'Express', 'MongoDB Atlas', 'SonarQube', 'OWASP ZAP', 'Python Engine', 'Docker', 'Vite'];

const About = () => (
  <section id="about" style={{ padding: '120px 48px', maxWidth: 1100, margin: '0 auto' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
      <motion.div 
        initial={{ opacity: 0, x: -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <div style={{ fontSize: 14, color: 'var(--purple)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
          Platform Vision
        </div>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 24px', letterSpacing: '-1px' }}>
          Engineering security trust
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 17, margin: '0 0 32px' }}>
          We believe security shouldn't be a bottleneck. SecOps Platform was built to provide 
          high-fidelity security signals without disrupting the developer experience.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            'All data stays within your perimeter',
            'ML intelligence reduces false positives',
            'Full compliance audit trail for every action',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 15, color: 'var(--text-primary)', fontWeight: 600 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={14} color="var(--green)" />
              </div>
              {item}
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        style={{ padding: '40px', background: 'rgba(29, 45, 61, 0.3)', borderRadius: 32, border: '1px solid var(--border)' }}
      >
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Native Integrations</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {techStack.map(t => (
            <motion.span 
              key={t}
              whileHover={{ scale: 1.1, background: 'var(--blue-dim)', borderColor: 'var(--blue)' }}
              style={{
                padding: '8px 16px', borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                fontSize: 14, color: 'var(--text-primary)', fontWeight: 600,
                cursor: 'default'
              }}>{t}</motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

// Contact
const Contact = () => {
  const { success } = useToast();
  return (
    <section id="contact" style={{
      padding: '120px 48px',
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64 }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--orange)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
            Connectivity
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px', letterSpacing: '-1px' }}>
            Let's talk security.
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 16 }}>
            Interested in deploying SecOps Platform at scale? Our core team is ready to help with architectural guidance.
          </p>
          <div style={{ marginTop: 32, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
              <Mail size={18} /> contact@secops.io
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
              <Globe size={18} /> secops-platform.docs
            </div>
          </div>
        </div>
        <Card style={{ padding: '32px' }}>
          <form onSubmit={e => { e.preventDefault(); success('Message received! We will be in touch.'); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block', fontWeight: 700 }}>NAME</label>
                <input required style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block', fontWeight: 700 }}>EMAIL</label>
                <input type="email" required style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block', fontWeight: 700 }}>MESSAGE</label>
              <textarea rows={4} required style={{
                width: '100%', padding: '12px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'none',
                fontFamily: 'inherit',
              }} />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              style={{
                padding: '14px', borderRadius: 12,
                background: 'var(--blue)', border: 'none',
                color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(79, 163, 255, 0.3)'
              }}
            >
              Send Message
            </motion.button>
          </form>
        </Card>
      </div>
    </section>
  );
};

// Footer 
const Footer = () => (
  <footer style={{
    borderTop: '1px solid var(--border)',
    padding: '48px',
    background: 'var(--bg-base)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 24,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Shield size={16} color="var(--blue)" />
      </div>
      <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
        © {new Date().getFullYear()} SecOps Platform. Built for Security Teams.
      </span>
    </div>
    <div style={{ display: 'flex', gap: 24 }}>
      {[
        { href: 'https://github.com', icon: LucideGitBranch, label: 'GitHub' },
        { href: '#contact', icon: Mail, label: 'Support' },
        { href: '/', icon: Globe, label: 'Platform' },
      ].map(({ href, icon: Icon, label }) => (
        <a key={label} href={href} style={{
          color: 'var(--text-muted)', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600,
          transition: 'color 0.2s'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--blue)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Icon size={16} /> {label}
        </a>
      ))}
    </div>
  </footer>
);

// Page 
const HomePage = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
    <Navbar />
    <Hero />
    <Features />
    <HowItWorks />
    <About />
    <Contact />
    <Footer />
  </div>
);

export default HomePage;
