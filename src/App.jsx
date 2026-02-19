import { useState, useEffect, useCallback } from 'react';
import mqtt from 'mqtt';
import './App.css';

/* ── helpers ── */
const fmt = (d) =>
  d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

const fmtDate = (d) =>
  d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/* ── MQTT topics ── */
const BROKER = 'ws://broker.hivemq.com:8000/mqtt';
const TOPIC_RELAY = 'mohith123/home/relay1';
const TOPIC_TEMP = 'mohith123/home/room1/temperature';
const TOPIC_HUM = 'mohith123/home/room1/humidity';

export default function App() {
  const [client, setClient] = useState(null);
  const [ledStatus, setLedStatus] = useState('OFF');
  const [temperature, setTemperature] = useState('--');
  const [humidity, setHumidity] = useState('--');
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
    const c = mqtt.connect(BROKER);
    c.on('connect', () => {
      setConnStatus('Connected');
      c.subscribe(TOPIC_RELAY);
      c.subscribe(TOPIC_TEMP);
      c.subscribe(TOPIC_HUM);
      setClient(c);
    });
    c.on('error', () => setConnStatus('Error'));
    c.on('offline', () => setConnStatus('Offline'));
    c.on('message', (topic, msg) => {
      const p = msg.toString();
      if (topic === TOPIC_RELAY) setLedStatus(p);
      if (topic === TOPIC_TEMP) setTemperature(p);
      if (topic === TOPIC_HUM) setHumidity(p);
    });
    return () => c.end();
  }, []);

  const toggle = useCallback((cmd) => {
    if (client) { client.publish(TOPIC_RELAY, cmd); setLedStatus(cmd); }
  }, [client]);

  const isOn = ledStatus === 'ON';
  const isConnected = connStatus === 'Connected';

  const tempColor =
    temperature === '--' ? 'var(--text-3)'
      : parseFloat(temperature) > 30 ? 'var(--red)'
        : parseFloat(temperature) < 18 ? 'var(--cyan)'
          : 'var(--amber)';

  const humColor =
    humidity === '--' ? 'var(--text-3)'
      : parseFloat(humidity) > 70 ? 'var(--cyan)'
        : parseFloat(humidity) < 30 ? 'var(--amber)'
          : 'var(--green)';

  return (
    <>
      <div className="app-bg"><div className="app-bg-grid" /></div>

      <div className="app-shell">

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon">🏠</div>
            <div className="brand-text">
              <span className="brand-name">HomeOS</span>
              <span className="brand-tagline">IoT Platform</span>
            </div>
          </div>

          <span className="nav-section-label">Menu</span>
          <div className="nav-item active"><span className="nav-icon">📊</span><span>Dashboard</span><span className="nav-badge">Live</span></div>
          <div className="nav-item"><span className="nav-icon">💡</span><span>Devices</span></div>
          <div className="nav-item"><span className="nav-icon">📈</span><span>Analytics</span></div>
          <div className="nav-item"><span className="nav-icon">⚙️</span><span>Settings</span></div>

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

        {/* ── Main ── */}
        <div className="main-content">

          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-left">
              <span className="topbar-title">Smart Climate Control</span>
              <span className="topbar-sub">{today}</span>
            </div>
            <div className="topbar-right">
              <span className={`conn-bar ${isConnected ? 'online' : 'offline'}`}>
                <span className="conn-dot" />
                {isConnected ? 'HiveMQ · Connected' : connStatus}
              </span>
              <div className="live-clock">{clock}</div>
              <div className="topbar-avatar">M</div>
            </div>
          </header>

          {/* Body */}
          <div className="dashboard-body">

            {/* Stat strip */}
            <div className="stats-row">
              <div className="stat-card" style={{ '--stat-color': isOn ? 'var(--green)' : 'var(--text-3)', '--stat-bg': 'var(--green-dim)', '--stat-border': 'rgba(52,211,153,0.2)' }}>
                <div className="stat-icon">💡</div>
                <div className="stat-info">
                  <span className="stat-value" style={{ color: isOn ? 'var(--green)' : 'var(--text-3)' }}>{ledStatus}</span>
                  <span className="stat-label">Light · Room 1</span>
                  <span className={`stat-trend ${isOn ? 'up' : 'neu'}`}>{isOn ? '↑ Active' : '— Standby'}</span>
                </div>
              </div>

              <div className="stat-card" style={{ '--stat-color': 'var(--amber)', '--stat-bg': 'var(--amber-dim)', '--stat-border': 'rgba(251,191,36,0.2)' }}>
                <div className="stat-icon">🌡️</div>
                <div className="stat-info">
                  <span className="stat-value" style={{ color: tempColor }}>
                    {temperature === '--' ? '--' : parseFloat(temperature).toFixed(1)}
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>°C</span>
                  </span>
                  <span className="stat-label">Temperature · Room 1</span>
                  <span className={`stat-trend ${temperature === '--' ? 'neu' : 'up'}`}>{temperature === '--' ? '— Waiting' : '↑ Live'}</span>
                </div>
              </div>

              <div className="stat-card" style={{ '--stat-color': 'var(--cyan)', '--stat-bg': 'var(--cyan-dim)', '--stat-border': 'rgba(34,211,238,0.2)' }}>
                <div className="stat-icon">💧</div>
                <div className="stat-info">
                  <span className="stat-value" style={{ color: humColor }}>
                    {humidity === '--' ? '--' : parseFloat(humidity).toFixed(0)}
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>%</span>
                  </span>
                  <span className="stat-label">Humidity · Room 1</span>
                  <span className={`stat-trend ${humidity === '--' ? 'neu' : 'up'}`}>{humidity === '--' ? '— Waiting' : '↑ Live'}</span>
                </div>
              </div>
            </div>

            {/* Relay control */}
            <div>
              <div className="section-header" style={{ marginBottom: '0.9rem' }}>
                <span className="section-title">Light Control</span>
                <span className="section-badge">Relay · Channel 1</span>
              </div>
              <div className={`relay-card ${isOn ? 'is-on' : ''}`}>
                <div className="relay-icon-side">{isOn ? '💡' : '🔌'}</div>
                <div className="relay-info">
                  <div className="relay-chip">⚡ Live MQTT</div>
                  <div className="relay-name">Main Room Light</div>
                  <div className="relay-desc">Real-time relay control via HiveMQ MQTT broker</div>
                  <div className="relay-meta">
                    <span className="meta-pill">📡 {TOPIC_RELAY}</span>
                    <span className="meta-pill">🌐 WS · Port 8000</span>
                  </div>
                </div>
                <div className="relay-controls">
                  <div className={`relay-state-badge ${isOn ? 'on' : 'off'}`}>
                    <span className="relay-state-dot" />{ledStatus}
                  </div>
                  <div className="relay-btn-group">
                    <button className={`relay-btn btn-on ${isOn ? 'active' : ''}`} onClick={() => toggle('ON')}>⚡ Turn ON</button>
                    <button className={`relay-btn btn-off ${!isOn ? 'active' : ''}`} onClick={() => toggle('OFF')}>✕ Turn OFF</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sensor cards */}
            <div>
              <div className="section-header" style={{ marginBottom: '0.9rem' }}>
                <span className="section-title">Live Sensors</span>
                <span className="section-badge">{TOPIC_TEMP.split('/')[2]}</span>
              </div>
              <div className="sensor-row">

                {/* Temperature */}
                <div className="sensor-card">
                  <div className="sensor-card-top">
                    <div className="sensor-icon" style={{ background: 'var(--amber-dim)', borderColor: 'rgba(251,191,36,0.25)' }}>🌡️</div>
                    <div className={`sensor-live-badge ${temperature !== '--' ? 'active' : ''}`}>
                      <span className="sensor-live-dot" />
                      {temperature !== '--' ? 'Live' : 'Waiting'}
                    </div>
                  </div>
                  <div className="sensor-big-val" style={{ color: tempColor }}>
                    {temperature === '--' ? '--' : parseFloat(temperature).toFixed(1)}
                    <span className="sensor-unit">°C</span>
                  </div>
                  <div className="sensor-name">Temperature</div>
                  <div className="sensor-topic">{TOPIC_TEMP}</div>
                  <div className="sensor-band" style={{ color: tempColor }}>
                    {temperature === '--' ? 'Awaiting data…'
                      : parseFloat(temperature) > 30 ? '🔴 Hot'
                        : parseFloat(temperature) < 18 ? '🔵 Cold'
                          : '🟡 Comfortable'}
                  </div>
                </div>

                {/* Humidity */}
                <div className="sensor-card">
                  <div className="sensor-card-top">
                    <div className="sensor-icon" style={{ background: 'var(--cyan-dim)', borderColor: 'rgba(34,211,238,0.25)' }}>💧</div>
                    <div className={`sensor-live-badge ${humidity !== '--' ? 'active' : ''}`}>
                      <span className="sensor-live-dot" />
                      {humidity !== '--' ? 'Live' : 'Waiting'}
                    </div>
                  </div>
                  <div className="sensor-big-val" style={{ color: humColor }}>
                    {humidity === '--' ? '--' : parseFloat(humidity).toFixed(0)}
                    <span className="sensor-unit">%</span>
                  </div>
                  <div className="sensor-name">Humidity</div>
                  <div className="sensor-topic">{TOPIC_HUM}</div>
                  <div className="sensor-band" style={{ color: humColor }}>
                    {humidity === '--' ? 'Awaiting data…'
                      : parseFloat(humidity) > 70 ? '� High'
                        : parseFloat(humidity) < 30 ? '🟡 Dry'
                          : '🟢 Optimal'}
                  </div>
                </div>

              </div>
            </div>

          </div>{/* end dashboard-body */}
        </div>{/* end main-content */}
      </div>
    </>
  );
}