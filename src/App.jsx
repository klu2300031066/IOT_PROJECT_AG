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
const TOPIC_TEMP = 'mohith123/home/room1/temperature';
const TOPIC_HUM = 'mohith123/home/room1/humidity';

// The three light topics
const TOPIC_DOOR = 'mohith123/home/door/light';
const TOPIC_BED = 'mohith123/home/bedroom/light';
const TOPIC_HALL = 'mohith123/home/hall/light';

export default function App() {
  const [client, setClient] = useState(null);
  const [connStatus, setConnStatus] = useState('Connecting…');
  const [clock, setClock] = useState(fmt(new Date()));
  const [today, setToday] = useState(fmtDate(new Date()));

  // Environment State
  const [temperature, setTemperature] = useState('--');
  const [humidity, setHumidity] = useState('--');

  // Independent Light States
  const [doorStatus, setDoorStatus] = useState('OFF');
  const [bedStatus, setBedStatus] = useState('OFF');
  const [hallStatus, setHallStatus] = useState('OFF');

  /* live clock */
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setClock(fmt(now));
      setToday(fmtDate(now));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* MQTT Connection & Subscriptions */
  useEffect(() => {
    const c = mqtt.connect(BROKER);

    c.on('connect', () => {
      setConnStatus('Connected');
      c.subscribe(TOPIC_TEMP);
      c.subscribe(TOPIC_HUM);
      c.subscribe(TOPIC_DOOR);
      c.subscribe(TOPIC_BED);
      c.subscribe(TOPIC_HALL);
      setClient(c);
    });

    c.on('error', () => setConnStatus('Error'));
    c.on('offline', () => setConnStatus('Offline'));

    c.on('message', (topic, msg) => {
      const payload = msg.toString();
      if (topic === TOPIC_TEMP) setTemperature(payload);
      if (topic === TOPIC_HUM) setHumidity(payload);
      if (topic === TOPIC_DOOR) setDoorStatus(payload);
      if (topic === TOPIC_BED) setBedStatus(payload);
      if (topic === TOPIC_HALL) setHallStatus(payload);
    });

    return () => c.end();
  }, []);

  /* toggle: flips current state of a light */
  const toggleLight = useCallback((topic, currentStatus) => {
    if (client) {
      const cmd = currentStatus === 'ON' ? 'OFF' : 'ON';
      client.publish(topic, cmd);
      if (topic === TOPIC_DOOR) setDoorStatus(cmd);
      if (topic === TOPIC_BED) setBedStatus(cmd);
      if (topic === TOPIC_HALL) setHallStatus(cmd);
    }
  }, [client]);

  const isConnected = connStatus === 'Connected';

  /* temperature colour band */
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

  const ACTIVE_LIGHTS = [
    { id: 'door', name: 'Front Door Light', topic: TOPIC_DOOR, status: doorStatus, icon: '🚪', channel: 'Channel 1' },
    { id: 'bed', name: 'Bedroom Light', topic: TOPIC_BED, status: bedStatus, icon: '🛏️', channel: 'Channel 2' },
    { id: 'hall', name: 'Hallway Light', topic: TOPIC_HALL, status: hallStatus, icon: '🛋️', channel: 'Channel 3' },
  ];

  const activeCount = ACTIVE_LIGHTS.filter(l => l.status === 'ON').length;

  return (
    <>
      <div className="app-bg"><div className="app-bg-grid" /></div>

      <div className="app-shell">

        {/* ════════ SIDEBAR ════════ */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon">🏠</div>
            <div className="brand-text">
              <span className="brand-name">NexusHome</span>
              <span className="brand-tagline">Intelligent Home Automation</span>
            </div>
          </div>

          <span className="nav-section-label">Navigation</span>
          <div className="nav-item active">
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
            <span className="nav-badge">Live</span>
          </div>
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

        {/* ════════ MAIN ════════ */}
        <div className="main-content">

          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-left">
              <span className="topbar-title">NexusHome</span>
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

          {/* Dashboard Body */}
          <div className="dashboard-body">

            {/* ── Environment ── */}
            <div>
              <div className="section-header" style={{ marginBottom: '0.9rem' }}>
                <span className="section-title">Environment</span>
                <span className="section-badge">Live Data</span>
              </div>

              <div className="env-card">
                <div className="env-grid">

                  <div className="env-item" style={{ '--ei-color': 'var(--amber)' }}>
                    <span className="env-emoji">🌡️</span>
                    <span className="env-value" style={{ color: tempColor }}>
                      {temperature === '--' ? '--' : `${parseFloat(temperature).toFixed(1)}°C`}
                    </span>
                    <span className="env-label">Temperature</span>
                    <span className="env-sub">
                      {temperature === '--' ? 'Awaiting data…'
                        : parseFloat(temperature) > 30 ? '🔴 Hot'
                          : parseFloat(temperature) < 18 ? '🔵 Cold'
                            : '🟡 Comfortable'}
                    </span>
                  </div>

                  <div className="env-item" style={{ '--ei-color': 'var(--cyan)' }}>
                    <span className="env-emoji">💧</span>
                    <span className="env-value" style={{ color: humColor }}>
                      {humidity === '--' ? '--' : `${parseFloat(humidity).toFixed(0)}%`}
                    </span>
                    <span className="env-label">Humidity</span>
                    <span className="env-sub">
                      {humidity === '--' ? 'Awaiting data…'
                        : parseFloat(humidity) > 70 ? '💧 High'
                          : parseFloat(humidity) < 30 ? '🟡 Dry'
                            : '🟢 Optimal'}
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* ── Lighting Zones ── */}
            <div style={{ marginTop: '2rem' }}>
              <div className="section-header" style={{ marginBottom: '0.9rem' }}>
                <span className="section-title">Lighting Zones</span>
                <span className="section-badge">{activeCount} Active</span>
              </div>

              <div className="devices-grid">
                {ACTIVE_LIGHTS.map((light) => {
                  const isOn = light.status === 'ON';
                  return (
                    <div key={light.id} className={`relay-card ${isOn ? 'is-on' : ''}`}>
                      <div className="relay-icon-side">
                        {isOn ? '💡' : light.icon}
                      </div>
                      <div className="relay-info">
                        <div className="relay-chip">⚡ Live Relay</div>
                        <div className="relay-name">{light.name}</div>
                        <div className="relay-meta">
                          <span className="meta-pill">🔌 {light.channel}</span>
                          <span className="meta-pill">📡 {light.topic}</span>
                        </div>
                      </div>
                      <div className="relay-controls">
                        <button
                          className={`relay-toggle-btn ${isOn ? 'is-on' : 'is-off'}`}
                          onClick={() => toggleLight(light.topic, light.status)}
                        >
                          <span className="relay-toggle-dot" />
                          {isOn ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>{/* end dashboard-body */}
        </div>{/* end main-content */}
      </div>
    </>
  );
}