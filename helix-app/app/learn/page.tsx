'use client'

import { useState } from 'react'
import { Clock, ChevronRight, Shield, Lock, Zap, CheckCircle, Globe, Terminal, Search, Network, Globe as GlobeIcon, Skull, BookOpen, Target, Trophy, Users, Star, ArrowRight } from 'lucide-react'

const categories = ['All Courses', 'Network Security', 'Web Exploitation', 'Digital Forensics', 'Cryptography', 'Linux & Systems', 'Malware Analysis']

const courses = [
  { title: 'Network Security Fundamentals', description: 'Master the basics of TCP/IP, subnetting, and network scanning with tools like Nmap and Wireshark. Build a solid foundation for all offensive security work.', duration: '4.5 hours', icon: Network, level: 'Beginner', levelColor: 'text-gray-400 border-gray-700', lessons: 12, students: '2.4k' },
  { title: 'Web Exploitation 101', description: 'Learn to identify and exploit common web vulnerabilities including SQL Injection, XSS, CSRF, and IDOR. Hands-on labs with real targets.', duration: '6 hours', icon: GlobeIcon, level: 'Intermediate', levelColor: 'text-gray-400 border-gray-700', lessons: 18, students: '3.1k' },
  { title: 'Advanced Malware Analysis', description: 'Dive deep into reverse engineering and behavioral analysis of sophisticated malicious software. Use Ghidra, IDA Pro, and sandbox environments.', duration: '12 hours', icon: Skull, level: 'Advanced', levelColor: 'text-red-400 border-red-900/50 bg-red-900/20', lessons: 24, students: '1.2k' },
  { title: 'Digital Forensics & IR', description: 'Learn the art of incident response and how to preserve digital evidence for forensic investigations. Memory dumps, disk imaging, and log analysis.', duration: '8 hours', icon: Shield, level: 'Intermediate', levelColor: 'text-gray-400 border-gray-700', lessons: 20, students: '1.8k' },
  { title: 'Crypto Cracking Masterclass', description: 'Explore encryption algorithms, hash functions, and modern techniques for breaking cryptographic barriers. Hashcat, John the Ripper, and custom scripts.', duration: '10 hours', icon: Lock, level: 'Advanced', levelColor: 'text-red-400 border-red-900/50 bg-red-900/20', lessons: 22, students: '980' },
  { title: 'Offensive Linux Systems', description: 'Master post-exploitation, privilege escalation, and persistence techniques on Linux-based environments. GTFOBins, SUID abuse, and cron exploitation.', duration: '5.5 hours', icon: Zap, level: 'Intermediate', levelColor: 'text-gray-400 border-gray-700', lessons: 15, students: '2.7k' },
  { title: 'Bug Bounty Methodology', description: 'Learn the complete bug bounty workflow from recon to report. HackerOne, Bugcrowd, and writing high-impact vulnerability reports that get paid.', duration: '7 hours', icon: Target, level: 'Intermediate', levelColor: 'text-gray-400 border-gray-700', lessons: 16, students: '4.2k' },
  { title: 'Active Directory Attacks', description: 'Kerberoasting, AS-REP roasting, Pass-the-Hash, BloodHound enumeration, and lateral movement through enterprise Windows environments.', duration: '9 hours', icon: Shield, level: 'Advanced', levelColor: 'text-red-400 border-red-900/50 bg-red-900/20', lessons: 21, students: '1.5k' },
  { title: 'CTF Fundamentals', description: 'Start competing in Capture The Flag competitions. Web, crypto, pwn, forensics, and OSINT challenges with guided walkthroughs and strategy.', duration: '5 hours', icon: Trophy, level: 'Beginner', levelColor: 'text-gray-400 border-gray-700', lessons: 14, students: '5.6k' },
  { title: 'Mobile App Security', description: 'Learn to pentest iOS and Android applications. Reverse engineering APKs, SSL pinning bypass, and exploiting mobile-specific vulnerabilities.', duration: '8.5 hours', icon: Terminal, level: 'Intermediate', levelColor: 'text-gray-400 border-gray-700', lessons: 19, students: '2.1k' },
  { title: 'Cloud Security & AWS Pentesting', description: 'Master cloud infrastructure security. S3 bucket misconfigurations, IAM privilege escalation, and exploiting serverless architectures.', duration: '11 hours', icon: Globe, level: 'Advanced', levelColor: 'text-red-400 border-red-900/50 bg-red-900/20', lessons: 25, students: '1.7k' },
  { title: 'Social Engineering Tactics', description: 'Psychological manipulation techniques, phishing campaigns, pretexting, and physical security testing. Learn the human side of hacking.', duration: '6.5 hours', icon: Users, level: 'Intermediate', levelColor: 'text-gray-400 border-gray-700', lessons: 17, students: '3.4k' },
]

const features = [
  { icon: Terminal, title: 'Hands-on Sandbox', description: 'Execute real exploits in our isolated, cloud-based terminal environments. No setup required — just hack.' },
  { icon: CheckCircle, title: 'Ethical Framework', description: 'Learn the legalities and professional standards of penetration testing. Stay legal, stay sharp.' },
  { icon: Globe, title: 'Global Leaderboard', description: 'Compete in CTF challenges and rank among top security researchers worldwide.' },
  { icon: BookOpen, title: 'Structured Learning', description: 'Follow curated paths from beginner to advanced. Each course builds on the last.' },
  { icon: Users, title: 'Community', description: 'Join thousands of hackers learning together. Share writeups, ask questions, collaborate.' },
  { icon: Star, title: 'Certifications', description: 'Earn Helix certificates for completed courses. Show your skills to employers and clients.' },
]

const stats = [
  { value: '12,000+', label: 'Active learners' },
  { value: '50+', label: 'Courses' },
  { value: '500+', label: 'Labs & challenges' },
  { value: '95%', label: 'Completion rate' },
]

export default function LearnPage() {
  const [activeCategory, setActiveCategory] = useState(0)

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflowY: 'auto' }}>

      {/* Search icon top right */}
      <div className="fixed top-5 right-6 z-50">
        <button className="text-gray-500 hover:text-white transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 pt-8 pb-16 space-y-20">

        {/* Hero */}
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="relative">
            <img src="/image.png" alt="Helix" className="w-24 h-24 rounded-full object-cover" style={{ mixBlendMode: 'screen', background: '#1a1a1a' }} />
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[#0d0d0d]" />
          </div>
          <div className="space-y-5 max-w-5xl">
            <h1 className="font-bold leading-tight whitespace-nowrap" style={{ fontSize: '62px' }}>
              Learn ethical hacking with <span className="text-blue-400">Helix</span>
            </h1>
            <p className="text-gray-400 text-xl leading-relaxed">
              Your AI-powered mentor for mastering cybersecurity. From zero to root, Helix guides you through every step of the offensive security lifecycle.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-8 pt-4">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-gray-500 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category filters — single line */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(i)}
              className={`px-6 py-3 rounded-xl text-base font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeCategory === i
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-[#111] text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course, i) => (
            <div key={i} className="bg-[#111] rounded-2xl p-7 border border-gray-800/50 flex flex-col hover:border-gray-700 transition-colors group" style={{ minWidth: 'calc(25% + 3px)' }}>
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-gray-800/60 flex items-center justify-center">
                  <course.icon className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${course.levelColor}`}>
                  {course.level}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">{course.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">{course.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-600 mb-5">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {course.lessons} lessons</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.students} students</span>
              </div>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/50">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <button className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                  Start Course <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Features */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to level up</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-[#111] rounded-2xl p-7 border border-gray-800/50 flex items-start gap-5 hover:border-gray-700 transition-colors">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-800/60 flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-green-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2 text-base">{f.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#111] rounded-3xl p-12 border border-gray-800/50 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to start hacking?</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">Join thousands of security researchers learning with Helix. Start your first course today — it's free.</p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors inline-flex items-center gap-2">
            Get started free <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  )
}
