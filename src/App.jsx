import { useState, useEffect, useCallback } from 'react';
import mqtt from 'mqtt';
import './App.css';

/* ── helpers ── */
const fmt = (d) =>
  d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

const fmtDate = (d) =>
  d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/* ── mock devices (non-functional, UI only) ── */
const MOCK_DEVICES = [
  {
    id: 'thermo',
    name: 'Thermostat',
    room: 'Living Room',
    icon: '🌡️',
    on: true,
    statusLabel: 'Setpoint',
    statusVal: '22 °C',
    color: 'var(--amber)',
    glow: 'var(--amber-glow)',
    bg: 'var(--amber-dim)',
    border: 'rgba(251,191,36,0.2)',
    activeBg: 'rgba(251,191,36,0.16)',
    activeBorder: 'rgba(251,191,36,0.38)',
  },
  {
    id: 'cam',
    name: 'Security Camera',
    room: 'Front Door',
    icon: '📷',
    on: true,
    statusLabel: 'Stream',
    statusVal: 'LIVE',
    color: 'var(--cyan)',
    glow: 'var(--cyan-glow)',
    bg: 'var(--cyan-dim)',
    border: 'rgba(34,211,238,0.2)',
    activeBg: 'rgba(34,211,238,0.14)',
    activeBorder: 'rgba(34,211,238,0.35)',
  },
  {
    id: 'lock',
    name: 'Smart Lock',
    room: 'Main Door',
    icon: '🔒',
    on: false,
    statusLabel: 'State',
    statusVal: 'LOCKED',
    color: 'var(--purple)',
    glow: 'var(--purple-glow)',
    bg: 'var(--purple-dim)',
    border: 'rgba(139,92,246,0.2)',
    activeBg: 'rgba(139,92,246,0.16)',
    activeBorder: 'rgba(139,92,246,0.35)',
  },
];

const ACTIVITY_LOG = [
  { id: 1, text: <><strong>Relay 1</strong> turned ON</>, time: 'Just now', color: 'var(--green)' },
  { id: 2, text: <><strong>Camera</strong> motion detected</>, time: '2m ago', color: 'var(--amber)' },
  { id: 3, text: <><strong>Thermostat</strong> adjusted to 22°C</>, time: '11m ago', color: 'var(--cyan)' },
  { id: 4, text: <><strong>Smart Lock</strong> locked</>, time: '34m ago', color: 'var(--purple)' },
];

const ENV_DATA = [
  { emoji: '🌡️', value: '24.2°C', label: 'Temperature', color: 'var(--amber)' },
  { emoji: '💧', value: '58%', label: 'Humidity', color: 'var(--cyan)' },
  { emoji: '🌬️', value: '1013 hPa', label: 'Pressure', color: 'var(--purple)' },
  { emoji: '💡', value: '340 lx', label: 'Luminance', color: 'var(--amber)' },
];

/* ════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════ */
export default function App() {
  const [client, setClient] = useState(null);
  const [ledStatus, setLedStatus] = useState('OFF');
  const [connStatus, setConnStatus] = useState('Connecting…');
  const [clock, setClock] = useState(fmt(new Date()));
  const [today, setToday] = useState(fmtDate(new Date()));

  /* live clock */
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setClock(fmt(now));
      setToday(fmtDate(now));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* MQTT */
  useEffect(() => {
    const c = mqtt.connect('ws://broker.hivemq.com:8000/mqtt');

    c.on('connect', () => {
      setConnStatus('Connected');
      c.subscribe('mohith123/home/relay1');
      setClient(c);
    });

    c.on('error', () => setConnStatus('Error'));
    c.on('offline', () => setConnStatus('Offline'));

    c.on('message', (topic, msg) => {
      if (topic === 'mohith123/home/relay1') setLedStatus(msg.toString());
    });

    return () => c.end();
  }, []);

  const toggle = useCallback((cmd) => {
    if (client) {
      client.publish('mohith123/home/relay1', cmd);
      setLedStatus(cmd);
    }
  }, [client]);

  const isOn = ledStatus === 'ON';
  const isConnected = connStatus === 'Connected';

  return (
    <>
      {/* Ambient Background */}
      <div className="app-bg">
        <div className="app-bg-grid" />
      </div>

      <div className="app-shell">

        {/* ════════ SIDEBAR ════════ */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon">🏠</div>
            <div className="brand-text">
              <span className="brand-name">HomeOS</span>
              <span className="brand-tagline">IoT Platform</span>
            </div>
          </div>

          <span className="nav-section-label">Navigation</span>

          <div className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
            <span className="nav-badge">Live</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">💡</span>
            <span>Devices</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">📈</span>
            <span>Analytics</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">🔔</span>
            <span>Alerts</span>
          </div>

          <span className="nav-section-label">System</span>

          <div className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">🛡️</span>
            <span>Security</span>
          </div>

          <div className="sidebar-footer">
            <div className="system-status">
              <div className={`status-dot-sm ${isConnected ? '' : 'offline'}`} />
              <div className="status-text-sm">
                MQTT Broker
                <span>{isConnected ? 'HiveMQ · Online' : connStatus}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ════════ MAIN ════════ */}
        <div className="main-content">

          {/* ── Topbar ── */}
          <header className="topbar">
            <div className="topbar-left">
              <span className="topbar-title">Dashboard Overview</span>
              <span className="topbar-sub">{today}</span>
            </div>
            <div className="topbar-right">
              <span className={`conn-bar ${isConnected ? 'online' : 'offline'}`}>
                <span className="conn-dot" />
                {isConnected ? 'HiveMQ Connected' : connStatus}
              </span>
              <div className="live-clock">{clock}</div>
              <div className="topbar-avatar">M</div>
            </div>
          </header>

          {/* ── Scrollable body ── */}
          <div className="dashboard-body">

            {/* Stats Row */}
            <div>
              <div className="section-header" style={{ marginBottom: '0.9rem' }}>
                <span className="section-title">System Overview</span>
                <span className="section-badge">Live</span>
              </div>
              <div className="stats-row">
                <div className="stat-card" style={{ '--stat-color': 'var(--purple)', '--stat-bg': 'var(--purple-dim)', '--stat-border': 'rgba(139,92,246,0.2)' }}>
                  <div className="stat-icon">💡</div>
                  <div className="stat-info">
                    <span className="stat-value">{isOn ? '1' : '0'}</span>
                    <span className="stat-label">Active Lights</span>
                    <span className={`stat-trend ${isOn ? 'up' : 'neu'}`}>{isOn ? '↑ Online' : '— Standby'}</span>
                  </div>
                </div>

                <div className="stat-card" style={{ '--stat-color': 'var(--green)', '--stat-bg': 'var(--green-dim)', '--stat-border': 'rgba(52,211,153,0.2)' }}>
                  <div className="stat-icon">📡</div>
                  <div className="stat-info">
                    <span className="stat-value">4</span>
                    <span className="stat-label">Devices Online</span>
                    <span className="stat-trend up">↑ All healthy</span>
                  </div>
                </div>

                <div className="stat-card" style={{ '--stat-color': 'var(--amber)', '--stat-bg': 'var(--amber-dim)', '--stat-border': 'rgba(251,191,36,0.2)' }}>
                  <div className="stat-icon">⚡</div>
                  <div className="stat-info">
                    <span className="stat-value">1.4<span style={{ fontSize: '0.8rem', fontWeight: 500 }}>kW</span></span>
                    <span className="stat-label">Power Usage</span>
                    <span className="stat-trend down">↓ 12% today</span>
                  </div>
                </div>

                <div className="stat-card" style={{ '--stat-color': 'var(--cyan)', '--stat-bg': 'var(--cyan-dim)', '--stat-border': 'rgba(34,211,238,0.2)' }}>
                  <div className="stat-icon">🛡️</div>
                  <div className="stat-info">
                    <span className="stat-value">OK</span>
                    <span className="stat-label">Security</span>
                    <span className="stat-trend up">↑ No alerts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Relay Control */}
            <div>
              <div className="section-header" style={{ marginBottom: '0.9rem' }}>
                <span className="section-title">Primary Control</span>
              </div>
              <div className={`relay-card ${isOn ? 'is-on' : ''}`}>
                <div className="relay-icon-side">
                  {isOn ? '💡' : '🔌'}
                </div>

                <div className="relay-info">
                  <div className="relay-chip">⚡ Live Relay</div>
                  <div className="relay-name">Main Room Light</div>
                  <div className="relay-desc">MQTT-controlled relay module via HiveMQ public broker</div>
                  <div className="relay-meta">
                    <span className="meta-pill">📡 mohith123/home/relay1</span>
                    <span className="meta-pill">🔌 Relay · Channel 1</span>
                    <span className="meta-pill">🌐 WS · Port 8000</span>
                  </div>
                </div>

                <div className="relay-controls">
                  <div className={`relay-state-badge ${isOn ? 'on' : 'off'}`}>
                    <span className="relay-state-dot" />
                    {isOn ? 'ON' : 'OFF'}
                  </div>
                  <div className="relay-btn-group">
                    <button
                      className={`relay-btn btn-on ${isOn ? 'active' : ''}`}
                      onClick={() => toggle('ON')}
                    >
                      ⚡ Turn ON
                    </button>
                    <button
                      className={`relay-btn btn-off ${!isOn ? 'active' : ''}`}
                      onClick={() => toggle('OFF')}
                    >
                      ✕ Turn OFF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Devices Grid */}
            <div>
              <div className="section-header" style={{ marginBottom: '0.9rem' }}>
                <span className="section-title">All Devices</span>
                <span className="section-badge">3 Online</span>
              </div>
              <div className="devices-grid">
                {MOCK_DEVICES.map((d) => (
                  <div
                    key={d.id}
                    className={`device-card mocked ${d.on ? 'is-on' : ''}`}
                    style={{
                      '--dc-color': d.color,
                      '--dc-glow': d.glow,
                      '--dc-bg': d.bg,
                      '--dc-border': d.border,
                      '--dc-active-bg': d.activeBg,
                      '--dc-active-border': d.activeBorder,
                    }}
                  >
                    <div className="dc-top">
                      <div className="dc-icon">{d.icon}</div>
                      <div className="dc-toggle" />
                    </div>
                    <div className="dc-info">
                      <div className="dc-name">{d.name}</div>
                      <div className="dc-room">{d.room}</div>
                    </div>
                    <div className="dc-status">
                      <span className="dc-status-label">{d.statusLabel}</span>
                      <span className={`dc-status-val ${d.on ? 'on' : 'off'}`}>{d.statusVal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="bottom-row">

              {/* Activity Log */}
              <div className="activity-card">
                <div className="card-heading">
                  <span className="card-title">Recent Activity</span>
                  <span className="card-link">View all →</span>
                </div>
                <div className="activity-list">
                  {ACTIVITY_LOG.map((a) => (
                    <div className="activity-item" key={a.id}>
                      <div className="activity-dot" style={{ background: a.color, boxShadow: `0 0 6px ${a.color}` }} />
                      <span className="activity-text">{a.text}</span>
                      <span className="activity-time">{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment */}
              <div className="env-card">
                <div className="card-heading">
                  <span className="card-title">Environment</span>
                  <span className="card-link">Sensors</span>
                </div>
                <div className="env-grid">
                  {ENV_DATA.map((e) => (
                    <div key={e.label} className="env-item" style={{ '--ei-color': e.color }}>
                      <span className="env-emoji">{e.emoji}</span>
                      <span className="env-value">{e.value}</span>
                      <span className="env-label">{e.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>{/* end dashboard-body */}
        </div>{/* end main-content */}
      </div>{/* end app-shell */}
    </>
  );
}