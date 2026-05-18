const SESSION_KEY = 'vaidyaai_asha_session'
const ASHA_NAME_KEY = 'asha_name'

export class ASHASession {
  static startSession(villageName) {
    const session = {
      id: Date.now(),
      villageName: villageName || 'Unknown Village',
      startTime: new Date().toISOString(),
      patients: [],
      ashaName: localStorage.getItem(ASHA_NAME_KEY) || '',
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  }

  static getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  static addPatient(patientData, triageResult) {
    const session = this.getSession()
    if (!session) return null
    session.patients.push({
      id: Date.now(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      ...patientData,
      triage: triageResult,
    })
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  }

  static exportReport(session) {
    if (!session) return ''
    const divider = '─'.repeat(40)
    const emergencies = session.patients.filter(p => p.triage?.triage_level === 'emergency').length
    const clinics = session.patients.filter(p => p.triage?.triage_level === 'clinic').length

    const lines = [
      '╔══════════════════════════════════════╗',
      '║     VAIDYAAI FIELD VISIT REPORT      ║',
      '╚══════════════════════════════════════╝',
      '',
      `Village     : ${session.villageName}`,
      `Date        : ${new Date(session.startTime).toLocaleDateString('en-IN')}`,
      `Start Time  : ${new Date(session.startTime).toLocaleTimeString('en-IN')}`,
      `ASHA Worker : ${session.ashaName || 'Not specified'}`,
      `Total Patients: ${session.patients.length}`,
      emergencies > 0 ? `⚠️  EMERGENCIES: ${emergencies}` : '',
      clinics > 0 ? `🏥 Clinic Referrals: ${clinics}` : '',
      '',
      divider,
      '',
      ...session.patients.flatMap((p, i) => [
        `PATIENT ${i + 1}  [${p.time}]`,
        `  ${p.gender || '—'}, ${p.age || '—'} yrs (${p.age_group || '—'})`,
        `  Complaint : ${p.chief_complaint || '—'}`,
        `  Duration  : ${p.duration_days || '—'} days`,
        `  Decision  : ${(p.triage?.triage_level || 'unknown').toUpperCase()} → ${p.triage?.refer_to || '—'}`,
        p.triage?.from_kit?.length
          ? `  From Kit  : ${p.triage.from_kit.join(' | ')}`
          : '',
        p.triage?.reasoning ? `  Reasoning : ${p.triage.reasoning}` : '',
        '',
      ]).filter(l => l !== undefined),
      divider,
      '',
      'Powered by VaidyaAI + Gemma 4 (Offline)',
      'Share this report with your PHC supervisor.',
    ]
    return lines.join('\n')
  }

  static clearSession() {
    localStorage.removeItem(SESSION_KEY)
  }

  static saveAshaName(name) {
    localStorage.setItem(ASHA_NAME_KEY, name)
  }
}
