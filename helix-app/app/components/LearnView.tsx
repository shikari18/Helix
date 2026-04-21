'use client'

import { useState } from 'react'
import { Clock, ChevronRight, Shield, Lock, Zap, CheckCircle, Globe, Terminal, Search, Network, Globe as GlobeIcon, Skull } from 'lucide-react'

const categories = ['All Courses', 'Network Security', 'Web Exploitation', 'Digital Forensics', 'Cryptography']

const courses = [
  { title: 'Network Security', description: 'Master the basics of TCP/IP, subnetting, and network scanning with tools like Nmap and Wireshark.', duration: '4.5 hours', icon: Network, level: 'Beginner', levelColor: 'text-gray-400 border-gray-700' },
  { title: 'Web Exploitation 101', description: 'Learn to identify and exploit common web vulnerabilities including SQL Injection, XSS, and CSRF.', duration: '6 hours', icon: GlobeIcon, level: 'Intermediate', levelColor: 'text-gray-400 border-gray-700' },
  { title: 'Advanced Malware Analysis', description: 'Dive deep into reverse engineering and behavioral analysis of sophisticated malicious software.', duration: '12 hours', icon: Skull, level: 'Advanced', levelColor: 'text-red-400 border-red-900/50 bg-red-900/20' },
  { title: 'Digital Forensics & IR', description: 'Learn the art of incident response and how to preserve digital evidence for forensic investigations.', duration: '8 hours', icon: Shield, level: 'Intermediate', levelColor: 'text-gray-400 border-gray-700' },
  { title: 'Crypto Cracking Masterclass', description: 'Explore encryption algorithms, hash functions, and modern techniques for breaking cryptographic barriers.', duration: '10 hours', icon: Lock, level: 'Advanced', levelColor: 'text-red-400 border-red-900/50 bg-red-900/20' },
  { title: 'Offensive Linux Systems', description: 'Master post-exploitation, privilege escalation, and persistence techniques on Linux-based environments.', duration: '5.5 hours', icon: Zap, level: 'Intermediate', levelColor: 'text-gray-400 border-gray-700' },
]

const features = [
  { icon: Terminal, title: 'Hands-on Sandbox', description: 'Execute real exploits in our isolated, cloud-based terminal environments.' },
  { icon: CheckCircle, title: 'Ethical Framework', description: 'Learn the legalities and professional standards of penetration testing.' },
  { icon: Globe, title: 'Global Leaderboard', description: 'Compete in CTF challenges and rank among top security researchers.' },
]

interface Props { onClose: () => void }

export default function LearnView({ onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState(0)

  return (
    <div style={{ all: 'revert', display: 'block' }}>
      <div className="min-h-screen bg-[#141414] text-white p-6 md:p-12">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Back button */}
          <div>
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Helix
            </button>
          </div>

          {/* Hero Section */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <img
                src="/image.png"
                alt="Helix"
                className="w-20 h-20 rounded-full object-cover"
                style={{ mixBlendMode: 'screen', background: '#1a1a1a' }}
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-[#141414]" />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold">
                Learn ethical hacking with <span className="text-blue-400">Helix</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                Your AI-powered mentor for mastering cybersecurity. From zero to root, Helix guides you through every step of the offensive security lifecycle.
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative flex-shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search courses, tools, or techniques..."
                className="w-full md:w-72 bg-[#1a1a1a] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-700"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setActiveCategory(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <div key={index} className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  {course.icon && <course.icon className="w-5 h-5 text-blue-400" strokeWidth={1.5} />}
                  <span className={`text-xs px-3 py-1 rounded-full border ${course.levelColor} ml-auto`}>
                    {course.level}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{course.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">{course.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <button className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                    Start Course <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50 flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-800/50 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-green-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
