'use client'

import Link from 'next/link'

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: '1. Beta Platform Acknowledgment',
      highlight: true,
      highlightText: 'Our Platform operates in beta status and may contain technical limitations, including potential vulnerabilities affecting data protection and system security. Your continued use demonstrates your awareness and acceptance of these inherent risks.',
      content: null,
    },
    {
      title: '2. Data Collection Practices',
      content: 'We gather and retain information that you voluntarily provide or that is generated through your Platform interactions. This encompasses personal identifiers (such as email addresses), user-generated content, uploaded materials, and technical data including security assessments, penetration test outputs, vulnerability documentation, and related cybersecurity artifacts.',
    },
    {
      title: '3. Data Utilization',
      content: 'Collected information serves multiple purposes: enabling Platform functionality, maintaining service integrity, implementing protective measures, advancing our technological capabilities, creating new features, and refining our AI-driven security testing infrastructure. We leverage this data to deliver personalized experiences and enhance overall service quality.',
    },
    {
      title: '4. Information Disclosure Practices',
      content: null,
      multiContent: [
        'We maintain strict confidentiality of personal information, with limited exceptions:',
        '<strong>Consent-Based Sharing:</strong> When you explicitly authorize disclosure.',
        '<strong>Legal Compliance:</strong> When we determine in good faith that disclosure is necessary to satisfy legal obligations, comply with regulatory mandates, respond to valid legal processes, or fulfill legitimate governmental requests.',
      ],
    },
    {
      title: '5. Beta Service Privacy Considerations',
      content: 'While we implement industry-standard privacy safeguards, you acknowledge that our beta-phase Platform may not provide the comprehensive protection level of a fully mature production environment. We remain committed to continuous improvement of our security infrastructure and privacy protocols. Your Platform use signifies understanding of these current limitations as we work toward enhanced protection measures.',
    },
    {
      title: '6. Security Measures',
      content: 'We employ commercially reasonable security practices to protect your information. However, we cannot provide absolute security guarantees. By using the Platform, you accept that you bear sole responsibility for any security incidents, data breaches, or system vulnerabilities that may occur.',
    },
    {
      title: '7. Policy Updates',
      content: 'We reserve the right to modify this Privacy Policy at any time. Changes become effective upon publication to this page. We encourage regular review of this document to stay informed about our data practices and any policy modifications.',
    },
    {
      title: '8. Contact and Support',
      content: null,
      jsx: <p style={{ fontSize: 15, color: '#b8b8b8', marginBottom: 18 }}>For inquiries regarding this Privacy Policy or our data practices, please visit our support portal at <a href="https://help.helix.co/en/" style={{ color: '#4a9eff', textDecoration: 'none' }}>help.helix.co</a>.</p>,
    },
    {
      title: '9. Binding Agreement',
      content: 'By accessing or utilizing our Platform, you confirm that you have read, understood, and agree to be bound by the terms of this Privacy Policy.',
    },
  ]

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

          <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 0, marginBottom: 20, color: '#fff', letterSpacing: -0.3 }}>Privacy Policy</h2>

          {/* Intro */}
          <div style={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 12, padding: 24, marginBottom: 40 }}>
            <p style={{ marginBottom: 0, color: '#d0d0d0', fontSize: 15 }}>This Privacy Policy outlines how HELIX LLC ("HELIX," "we," "us," or "our") handles information related to our platform, associated tools, and all connected offerings (the "Platform"). Your access to and use of the Platform indicates your consent to the data practices described herein.</p>
          </div>

          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginTop: 48, marginBottom: 20, color: '#fff', letterSpacing: -0.3 }}>{s.title}</h2>
              {s.highlight && (
                <div style={{ background: '#1a1a1a', borderLeft: '3px solid #4a9eff', padding: 20, margin: '24px 0', borderRadius: 8 }}>
                  <p style={{ marginBottom: 0, fontSize: 15, color: '#b8b8b8' }}><strong style={{ color: '#fff' }}>Important Notice:</strong> {s.highlightText}</p>
                </div>
              )}
              {s.content && <p style={{ fontSize: 15, color: '#b8b8b8', marginBottom: 18 }}>{s.content}</p>}
              {s.multiContent && s.multiContent.map((c, j) => (
                <p key={j} style={{ fontSize: 15, color: '#b8b8b8', marginBottom: 18 }} dangerouslySetInnerHTML={{ __html: c }} />
              ))}
              {s.jsx}
            </div>
          ))}

          <p style={{ fontSize: 13, color: '#666', marginTop: 60, paddingTop: 24, borderTop: '1px solid #2d2d2d' }}>Last updated: April 2026</p>
        </div>
      </div>
    </>
  )
}
