import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ChevronRight, GitBranch, AlertTriangle, 
  Zap, Brain, ArrowRight, CheckCircle, Mail, 
  Globe, Menu, X, Terminal, Cpu, Lock, 
  Activity, ShieldCheck, Database, Fingerprint
} from 'lucide-react';
import useToast from '../hooks/useToast';
import Card from '../components/ui/Card';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/80 backdrop-blur-xl border-b border-border-main h-16 flex items-center justify-between px-6 lg:px-12 transition-all duration-300">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-purple rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/20"
          >
            <Shield size={22} className="text-white" strokeWidth={2.5} />
          </motion.div>
          <span className="text-lg font-black text-text-primary tracking-tight">SecOps Intelligence</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Intelligence', 'Architecture', 'Contact'].map(label => (
            <a key={label} href={`#${label.toLowerCase()}`} className="text-sm font-bold text-text-muted hover:text-brand-blue transition-colors uppercase tracking-widest">
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:block text-sm font-bold text-text-primary hover:text-brand-blue transition-colors uppercase tracking-widest px-4">
            Login
          </Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link to="/register" className="bg-brand-blue text-white text-xs font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-xl shadow-lg shadow-brand-blue/20 hover:shadow-brand-blue/40 transition-all">
              Initialize
            </Link>
          </motion.div>
          
          <button 
            className="md:hidden p-2 text-text-muted hover:text-text-primary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-16 left-0 right-0 z-[90] bg-bg-card border-b border-border-main md:hidden overflow-hidden shadow-2xl"
          >
            <div className="flex flex-col p-6 space-y-4">
              {['Features', 'Intelligence', 'Architecture', 'Contact'].map(label => (
                <a key={label} href={`#${label.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-sm font-black text-text-primary uppercase tracking-widest py-2 border-b border-border-main/50 last:border-0">
                  {label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4">
                <Link to="/login" className="w-full py-3 text-center text-sm font-black text-text-primary border border-border-main rounded-xl uppercase tracking-widest">Login</Link>
                <Link to="/register" className="w-full py-3 text-center text-sm font-black text-white bg-brand-blue rounded-xl uppercase tracking-widest shadow-lg shadow-brand-blue/20">Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Hero = () => (
  <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 relative overflow-hidden">
    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
    <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[150px] animate-pulse pointer-events-none" />

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="max-w-5xl relative z-10"
    >
      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-border-main bg-bg-card/50 backdrop-blur-md text-[10px] font-black text-brand-blue uppercase tracking-[0.25em] mb-10 shadow-xl">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
        </span>
        Autonomous Security Orchestration
      </div>

      <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-text-primary leading-[1.05] tracking-tight mb-8">
        Hardening the <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-purple to-brand-blue bg-[length:200%_auto] animate-gradient">Supply Chain.</span>
      </h1>

      <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed font-medium mb-12">
        Integrated static, dynamic, and dependency analysis powered by proprietary ML intelligence. Gate releases with confidence.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link to="/register" className="flex items-center gap-3 px-10 py-5 bg-brand-blue text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-brand-blue/30 hover:shadow-brand-blue/50 transition-all group">
            Start Secure Workflow <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <a href="#features" className="flex items-center gap-3 px-10 py-5 bg-bg-card/50 border border-border-main text-text-primary text-sm font-black uppercase tracking-widest rounded-2xl backdrop-blur-md hover:bg-bg-elevated transition-all">
            Technical Specs <Terminal size={20} className="text-brand-purple" />
          </a>
        </motion.div>
      </div>
    </motion.div>

    <motion.div 
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 1 }}
      className="mt-24 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-bg-card/30 border border-border-main/50 rounded-3xl backdrop-blur-sm relative z-10"
    >
      {[
        { label: 'Ingest', icon: GitBranch, color: 'text-brand-blue' },
        { label: 'SAST', icon: Shield, color: 'text-brand-purple' },
        { label: 'SCA', icon: Database, color: 'text-brand-orange' },
        { label: 'DAST', icon: Zap, color: 'text-brand-red' },
        { label: 'Neural', icon: Brain, color: 'text-brand-blue' },
        { label: 'Release', icon: ShieldCheck, color: 'text-brand-green' },
      ].map((step, i) => (
        <div key={step.label} className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-bg-card border border-border-main shadow-lg">
          <step.icon size={20} className={step.color} />
          <span className="text-xs font-black text-text-primary uppercase tracking-widest">{step.label}</span>
        </div>
      ))}
    </motion.div>
  </section>
);

const Features = () => (
  <section id="features" className="py-32 px-6 lg:px-12 max-w-7xl mx-auto">
    <div className="text-center mb-20 space-y-4">
      <h4 className="text-xs font-black text-brand-blue uppercase tracking-[0.3em]">Operational Capabilities</h4>
      <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">Full-Stack Security Automation</h2>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        {
          icon: GitBranch, color: 'text-brand-blue', bg: 'bg-brand-blue/10',
          title: 'Static Analysis',
          desc: 'Deep inspection of source code patterns using enterprise-grade SAST engines to detect vulnerabilities before compilation.',
        },
        {
          icon: Activity, color: 'text-brand-orange', bg: 'bg-brand-orange/10',
          title: 'Composition Audit',
          desc: 'Comprehensive mapping of third-party dependencies. Identify critical CVEs and transitive licensing risks across the entire stack.',
        },
        {
          icon: Zap, color: 'text-brand-red', bg: 'bg-brand-red/10',
          title: 'Runtime Probing',
          desc: 'Automated DAST execution against staging environments. Actively test for injection, broken auth, and configuration flaws.',
        },
        {
          icon: Brain, color: 'text-brand-purple', bg: 'bg-brand-purple/10',
          title: 'Neural Gating',
          desc: 'Proprietary ML models weight multi-vector signals to make high-fidelity release decisions and eliminate false positives.',
        },
      ].map((feature, i) => (
        <Card key={i} className="group hover:border-brand-blue/30 transition-all duration-500">
          <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-8 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
            <feature.icon size={28} className={feature.color} />
          </div>
          <h3 className="text-lg font-black text-text-primary tracking-tight mb-4 uppercase">{feature.title}</h3>
          <p className="text-sm text-text-muted font-medium leading-relaxed">{feature.desc}</p>
          <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-brand-blue uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Learn More <ChevronRight size={14} />
          </div>
        </Card>
      ))}
    </div>
  </section>
);

const Architecture = () => (
  <section id="architecture" className="py-32 bg-bg-elevated/30 border-y border-border-main relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
      <div className="space-y-8">
        <div className="space-y-4">
          <h4 className="text-xs font-black text-brand-purple uppercase tracking-[0.3em]">Integrity Core</h4>
          <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight leading-tight">Engineered for <br/> Zero-Trust Pipelines</h2>
        </div>
        <p className="text-lg text-text-muted font-medium leading-relaxed">
          The SecOps Platform operates on a secure-by-default architecture, ensuring your source code and scan data remain within authorized parameters.
        </p>
        <div className="grid gap-6 pt-4">
          {[
            { icon: Lock, label: 'HMAC-SHA256 Payload Verification', color: 'text-brand-green' },
            { icon: Fingerprint, label: 'Neural Risk Fingerprinting', color: 'text-brand-blue' },
            { icon: ShieldCheck, label: 'Immutable Compliance Ledger', color: 'text-brand-purple' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-bg-card p-4 rounded-2xl border border-border-main shadow-xl">
              <div className={`p-2.5 bg-bg-elevated rounded-xl ${item.color}`}>
                <item.icon size={20} />
              </div>
              <span className="text-sm font-black text-text-primary uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-brand-blue/5 blur-[100px] rounded-full pointer-events-none" />
        <Card className="bg-black/40 border-border-main shadow-2xl overflow-hidden p-0 backdrop-blur-md">
          <div className="bg-bg-elevated p-4 border-b border-border-main flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-red/50" />
            <div className="w-3 h-3 rounded-full bg-brand-orange/50" />
            <div className="w-3 h-3 rounded-full bg-brand-green/50" />
            <div className="ml-4 text-[10px] font-mono text-text-muted uppercase tracking-widest">telemetry_feed.log</div>
          </div>
          <div className="p-8 font-mono text-[11px] leading-relaxed space-y-2">
            <p className="text-brand-blue">[SYSTEM] INITIALIZING SECURE ORCHESTRATOR...</p>
            <p className="text-text-muted">[PUSH] COMMIT_ID: 7f3a2c1 | REPO: CORE-API</p>
            <p className="text-brand-purple">[SAST] ANALYZING DATA FLOW GRAPHS...</p>
            <p className="text-brand-purple">[SAST] COMPLETED: 0 CRITICAL FINDINGS</p>
            <p className="text-brand-orange">[SCA] COMPARING DEPENDENCY TREE (312 PKGS)...</p>
            <p className="text-brand-red">[SCA] WARNING: CVE-2024-1234 DETECTED IN LODASH@4.17</p>
            <p className="text-brand-blue">[ML] RE-EVALUATING RISK POSTURE...</p>
            <p className="text-brand-blue">[ML] SCORE: 42/100 | DECISION: APPROVED</p>
            <p className="text-brand-green font-black">[GATE] GATE OPEN: DEPLOYING TO STAGING</p>
            <div className="pt-2 animate-pulse w-2 h-4 bg-brand-blue" />
          </div>
        </Card>
      </div>
    </div>
  </section>
);

const Contact = () => {
  const { success } = useToast();
  return (
    <section id="contact" className="py-32 px-6 lg:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-brand-orange uppercase tracking-[0.3em]">Connectivity</h4>
            <h2 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">Deploy SecOps at Scale</h2>
          </div>
          <p className="text-lg text-text-muted font-medium leading-relaxed max-w-md">
            Our platform engineering team is available for architectural reviews and deployment assistance.
          </p>
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-4 text-text-primary font-bold">
              <div className="p-2.5 bg-bg-elevated rounded-xl text-brand-blue border border-border-main">
                <Mail size={20} />
              </div>
              support@secops-platform.io
            </div>
            <div className="flex items-center gap-4 text-text-primary font-bold">
              <div className="p-2.5 bg-bg-elevated rounded-xl text-brand-purple border border-border-main">
                <Globe size={20} />
              </div>
              docs.secops-platform.io
            </div>
          </div>
        </div>

        <Card className="bg-bg-elevated/20 border-border-main shadow-2xl p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl rounded-full" />
          <form onSubmit={e => { e.preventDefault(); success('IDENTITY VERIFIED: Message received.'); }} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Operative Name</label>
                <input required className="w-full bg-bg-card border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-brand-orange/50 transition-all shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Intelligence Vector (Email)</label>
                <input type="email" required className="w-full bg-bg-card border border-border-main rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-brand-orange/50 transition-all shadow-inner" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Strategic Brief (Message)</label>
              <textarea rows={4} required className="w-full bg-bg-card border border-border-main rounded-xl px-4 py-3 text-sm font-medium text-text-primary outline-none focus:border-brand-orange/50 transition-all shadow-inner resize-none" />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="w-full py-4 bg-brand-orange text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-brand-orange/20 hover:shadow-brand-orange/40 transition-all"
            >
              Dispatch Briefing
            </motion.button>
          </form>
        </Card>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-12 px-6 lg:px-12 border-t border-border-main bg-bg-base/50 backdrop-blur-md">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-bg-elevated border border-border-main rounded-lg text-brand-blue">
          <Shield size={18} />
        </div>
        <p className="text-xs font-black text-text-muted uppercase tracking-widest">
          © {new Date().getFullYear()} SECOPS PLATFORM AG. ALL RIGHTS RESERVED.
        </p>
      </div>
      
      <div className="flex items-center gap-8">
        {[
          { href: '#', icon: GitBranch, label: 'GitHub' },
          { href: '#', icon: Terminal, label: 'Status' },
          { href: '#', icon: Lock, label: 'Security' },
        ].map(({ href, icon: Icon, label }) => (
          <a key={label} href={href} className="flex items-center gap-2 text-[10px] font-black text-text-muted hover:text-brand-blue transition-colors uppercase tracking-widest">
            <Icon size={14} /> {label}
          </a>
        ))}
      </div>
    </div>
  </footer>
);

const HomePage = () => (
  <div className="min-h-screen bg-bg-base text-text-primary selection:bg-brand-blue/30 selection:text-white font-sans overflow-x-hidden">
    <Navbar />
    <Hero />
    <Features />
    <Architecture />
    <Contact />
    <Footer />
  </div>
);

export default HomePage;
