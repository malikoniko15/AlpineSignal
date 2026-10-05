import React, { useState, useEffect, useRef } from 'react';

const C = {
  bg: '#FAFAF7', ink: '#0D110E', green: '#1F4433', greenDeep: '#0F2318',
  greenBright: '#3FCB7C', line: '#DEDCD3', sub: '#5B6560', red: '#B4443A'
};

const DRONE_NAMES = { 1: 'ущелье Аюсай', 2: 'ущелье Шарын', 3: 'Кольсайские озёра' };
const DRONE_COORDS = { 1: '43.1872° N, 77.0546° E', 2: '43.2131° N, 79.0552° E', 3: '42.9989° N, 78.3585° E' };

export default function Radar({ onBack }) {
  const [tab, setTab] = useState('mic');

  // ---- mic radar (unchanged logic) ----
  const [isListening, setIsListening] = useState(false);
  const [sosDetected, setSosDetected] = useState(false);
  const [statusText, setStatusText] = useState('Радар выключен');
  const [profile, setProfile] = useState(null);

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animIdRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mtb_profile');
      if (raw) setProfile(JSON.parse(raw));
    } catch (e) {}
  }, [sosDetected]);

  const startRadar = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      setIsListening(true);
      setStatusText('Сканирование ультразвукового эфира (21 кГц)...');
      drawSpectrum();
    } catch (err) {
      setStatusText('Ошибка доступа к микрофону: ' + err.message);
    }
  };

  const stopRadar = () => {
    if (audioCtxRef.current) audioCtxRef.current.close();
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    setIsListening(false);
    setStatusText('Радар остановлен');
  };

  const drawSpectrum = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const render = () => {
      animIdRef.current = requestAnimationFrame(render);
      analyserRef.current.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let highFreqSum = 0;
      const binWidth = canvas.width / dataArray.length;
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const isHighFreq = i > dataArray.length * 0.7;
        ctx.fillStyle = isHighFreq ? C.red : C.greenBright;
        ctx.fillRect(i * binWidth, canvas.height - barHeight, binWidth - 1, barHeight);
        if (isHighFreq) highFreqSum += dataArray[i];
      }
      if (highFreqSum > 250) setSosDetected(true);
    };
    render();
  };

  // ---- drone tab (simulated telemetry) ----
  const [droneId, setDroneId] = useState('1');
  const [droneAlt, setDroneAlt] = useState(120);
  const [droneSig, setDroneSig] = useState(40);
  const [droneLink, setDroneLink] = useState(42);

  useEffect(() => {
    const it = setInterval(() => {
      setDroneSig(30 + Math.round(Math.random() * 55));
      setDroneAlt(110 + Math.round(Math.random() * 20));
      setDroneLink(30 + Math.round(Math.random() * 25));
    }, 1400);
    return () => clearInterval(it);
  }, []);

  const card = { background: '#fff', border: `1px solid ${C.line}`, borderRadius: '20px', padding: '24px' };
  const btn = { padding: '12px 20px', borderRadius: '999px', fontSize: '13.5px', fontWeight: 600, border: `1px solid ${C.ink}`, background: C.ink, color: '#fff', cursor: 'pointer' };
  const btnOutline = { ...btn, background: 'transparent', color: C.ink };
  const inputStyle = { width: '100%', padding: '11px 13px', border: `1px solid ${C.line}`, borderRadius: '9px', fontFamily: 'Inter, sans-serif', fontSize: '14px', background: '#fff', color: C.ink, boxSizing: 'border-box' };
  const tabBtn = (active) => ({ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${active ? C.greenDeep : C.line}`, background: active ? C.greenDeep : '#fff', color: active ? '#fff' : C.sub, fontSize: '13px', fontWeight: 600, cursor: 'pointer' });

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      <button onClick={onBack} style={{ ...btnOutline, borderColor: C.green, color: C.green, padding: '8px 16px', marginBottom: '20px' }}>
        &larr; Назад на Лендинг
      </button>

      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontFamily: "'Fraunces', serif" }}>Радар / Поисковый Терминал</h2>
          <p style={{ color: C.sub, fontSize: '13px', lineHeight: 1.5 }}>
            Панель режима поиска: пассивный микрофон для пеших групп или подключение дрона МЧС.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button style={tabBtn(tab === 'mic')} onClick={() => setTab('mic')}>Микрофон смартфона</button>
          <button style={tabBtn(tab === 'drone')} onClick={() => setTab('drone')}>Дрон МЧС (Raspberry Pi)</button>
        </div>

        {tab === 'mic' && (
          <div style={{ ...card, textAlign: 'center' }}>
            <canvas ref={canvasRef} width="360" height="140" style={{ width: '100%', background: C.greenDeep, borderRadius: '16px', border: `1px solid ${C.line}` }} />
            <button
              onClick={isListening ? stopRadar : startRadar}
              style={{ ...btn, width: '100%', padding: '16px', fontSize: '16px', marginTop: '20px', background: isListening ? '#EFEFEA' : C.red, color: isListening ? C.ink : '#fff', borderColor: isListening ? C.line : C.red }}
            >
              {isListening ? 'Остановить Радар' : 'Запустить Акустический Радар'}
            </button>
            <div style={{ marginTop: '16px', fontSize: '13px', color: C.sub }}>{statusText}</div>

            {sosDetected && (
              <div style={{ marginTop: '20px', padding: '20px', background: '#FBEAE8', border: `2px solid ${C.red}`, borderRadius: '16px', textAlign: 'left' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: C.red }}>СИГНАЛ БЕДСТВИЯ ОБНАРУЖЕН!</div>
                <div style={{ fontSize: '13px', color: C.ink, marginTop: '6px' }}>Акустический пик: ~20.8 кГц (Дистанция: ~1.5 м)</div>
                <div style={{ marginTop: '12px', background: C.greenDeep, color: '#fff', borderRadius: '10px', padding: '14px 16px', fontFamily: 'ui-monospace, monospace', fontSize: '12.5px', lineHeight: 1.9 }}>
                  {profile && profile.name ? (
                    <>
                      <div><span style={{ color: '#8FB39E' }}>Сигнал от:</span> {profile.name}</div>
                      <div><span style={{ color: '#8FB39E' }}>Телефон:</span> {profile.phone || '—'}</div>
                      <div><span style={{ color: '#8FB39E' }}>Группа крови:</span> {profile.blood || '—'}</div>
                      <div><span style={{ color: '#8FB39E' }}>Контакт близкого:</span> {profile.emg || '—'}</div>
                      <div><span style={{ color: '#8FB39E' }}>Примечания:</span> {profile.notes || 'нет'}</div>
                    </>
                  ) : (
                    <div style={{ fontFamily: 'Inter, sans-serif', color: '#B9C6BE' }}>Профиль пострадавшего не заполнен в приложении «Турист».</div>
                  )}
                </div>
                <button onClick={() => setSosDetected(false)} style={{ marginTop: '12px', ...btn, background: C.red, borderColor: C.red }}>
                  Сбросить Алерт
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'drone' && (
          <div style={{ ...card, background: C.greenDeep, color: '#fff' }}>
            <label style={{ fontSize: '12.5px', color: '#B9C6BE', display: 'block', marginBottom: '8px' }}>Выбрать дрон</label>
            <select style={{ ...inputStyle, background: '#0A1B12', color: '#fff', borderColor: '#2A4335', marginBottom: '16px' }} value={droneId} onChange={e => setDroneId(e.target.value)}>
              <option value="1">Дрон №1 — ущелье Аюсай</option>
              <option value="2">Дрон №2 — ущелье Шарын</option>
              <option value="3">Дрон №3 — Кольсайские озёра</option>
            </select>
            <div style={{ fontSize: '13px', color: C.greenBright, marginBottom: '10px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              Сканирование {DRONE_NAMES[droneId]}...
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#C9D6CE', lineHeight: 2 }}>
              <div>Координаты: <span style={{ color: C.greenBright }}>{DRONE_COORDS[droneId]}</span></div>
              <div>Высота: <span style={{ color: C.greenBright }}>{droneAlt} м</span></div>
              <div>Радиоканал: <span style={{ color: C.greenBright }}>Стабильно · {droneLink} мс</span></div>
              <div>Акустический сигнал с высоты:</div>
              <div style={{ height: '8px', background: '#0A1B12', borderRadius: '5px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ height: '100%', background: C.greenBright, width: droneSig + '%', transition: 'width .3s' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
