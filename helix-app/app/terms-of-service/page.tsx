'use client'

import Link from 'next/link'

const sections = [
  { title: '1. Acceptable Use Standards', content: 'You commit to utilizing our Services exclusively within the boundaries of applicable legal frameworks, industry standards, and regulatory requirements. Any deployment of our Services must align with established legal protocols and ethical guidelines governing cybersecurity operations.' },
  { title: '2. Disclaimer of Warranties and Liability', content: 'HELIX LLC, including all associated entities, stakeholders, personnel, representatives, and authorized partners, expressly disclaims all liability for any harm, loss, or adverse outcome—whether foreseeable or unforeseeable, direct or indirect, material or immaterial—that may result from your interaction with our Services. This disclaimer applies regardless of whether such interaction complies with legal standards or violates them.' },
  { title: '3. Content Neutrality', content: 'We maintain a position of neutrality regarding all user-generated content, communications, and data processed through our Services. HELIX LLC makes no representations regarding the validity, precision, dependability, or appropriateness of any information or viewpoints expressed by users within our platform ecosystem.' },
  { title: '4. User Accountability and Protection Obligations', content: 'You acknowledge complete accountability for all risks inherent in your utilization of our Services. You further commit to defending, compensating, and protecting HELIX LLC and all affiliated parties from any legal claims, proceedings, demands, or financial obligations—including but not limited to attorney fees, court costs, settlement amounts, regulatory penalties, and associated expenses—that arise from your use of our Services or any violation of these terms.' },
  { title: '5. Terms Modification Rights', content: 'We retain the authority to revise, amend, or replace these Terms of Service at our discretion, without advance notification. Continued use of our Services following any modifications constitutes your binding acceptance of the revised terms. We recommend periodic review of this document to stay informed of any changes.' },
  { title: '6. Provision Independence', content: 'Should any component of these Terms of Service be deemed unenforceable or invalid by a judicial authority, the remaining provisions shall continue in full effect. Courts are encouraged to interpret any problematic provision in a manner that preserves the original intent while maintaining legal validity.' },
  { title: '7. Agreement Confirmation', content: 'Your use of HELIX Services constitutes your acknowledgment that you have reviewed, comprehended, and agreed to be bound by these Terms of Service. If you find these terms unacceptable, you must immediately discontinue use of our Services.' },
]

export default function TermsOfServicePage() {
  return (
    <>
      <style>{`
        body { overflow: auto !important; display: block !important; padding: 0 !important; }
        .back-link:hover { color: #fff !important; }
        a:hover { color: #6bb3ff !important; }
      `}</style>
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#141414', color: '#e8e8e8', lineHeight: 1.8, padding: '40px 20px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 60, paddingBottom: 24, borderBottom: '1px solid #2d2d2d' }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: -0.5 }}>HELIX</h1>
            <Link href="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#888', textDecoration: 'none', transition: 'color 0.2s' }}>← Back</Link>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 0, marginBottom: 20, color: '#fff', letterSpacing: -0.3 }}>Terms of Service</h2>

          {/* Intro */}
          <div style={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 12, padding: 24, marginBottom: 40 }}>
            <p style={{ marginBottom: 0, color: '#d0d0d0', fontSize: 15 }}>Welcome to HELIX. These terms govern your access to and use of all tools, platforms, and resources (collectively, "Services") offered by HELIX LLC ("we," "us," or "our"). By accessing our Services, you accept these terms in full.</p>
          </div>

          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 48, marginBottom: 20, color: '#fff', letterSpacing: -0.3 }}>{s.title}</h2>
              <p style={{ fontSize: 15, color: '#b8b8b8', marginBottom: 18 }}>{s.content}</p>
            </div>
          ))}

          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 48, marginBottom: 20, color: '#fff', letterSpacing: -0.3 }}>Contact Information</h2>
            <p style={{ fontSize: 15, color: '#b8b8b8', marginBottom: 18 }}>
              For questions or concerns regarding these Terms of Service, please visit our support center at{' '}
              <a href="https://help.helix.co/en/" style={{ color: '#4a9eff', textDecoration: 'none' }}>help.helix.co</a>.
            </p>
          </div>

          <p style={{ fontSize: 13, color: '#666', marginTop: 60, paddingTop: 24, borderTop: '1px solid #2d2d2d' }}>Last updated: April 2026</p>
        </div>
      </div>
    </>
  )
}
