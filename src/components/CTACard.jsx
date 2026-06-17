export default function CTACard({ visible, onDismiss }) {
  if (!visible) return null

  return (
    <div className="cta-card">
      <button className="cta-dismiss" onClick={onDismiss} aria-label="Dismiss">×</button>
      <div className="cta-title">Ready to give your team their own AI coach?</div>
      <div className="cta-subtitle">
        Trainiac brings personalised AI coaching to every Wellhub member.
      </div>
      <a
        href="mailto:lilit.arutyunyan@gympass.com"
        className="btn-cta"
      >
        Talk to us
      </a>
    </div>
  )
}
