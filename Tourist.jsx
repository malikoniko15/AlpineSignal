import React, { useState, useEffect, useRef } from 'react';

const NAME_EXAMPLES = ['Berikbayeva Asel', 'Berikbayev Yerasyl'];
const WATCH_MODELS = [
  'Apple Watch Series 10',
  'Garmin Fenix 8',
  'Samsung Galaxy Watch 7',
  'Xiaomi Mi Band 9',
  'Huawei Watch GT 5',
  'Amazfit Balance 2'
];

// palette matching Landing.jsx
const C = {
  bg: '#FAFAF7', ink: '#0D110E', green: '#1F4433', greenDeep: '#0F2318',
  greenBright: '#3FCB7C', line: '#DEDCD3', sub: '#5B6560', red: '#B4443A'
};

export default function Tourist({ onBack }) {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Нажмите кнопку для активации защиты в горах');
  const [lastImpact, setLastImpact] = useState(null);

  // ---- profile form ----
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [blood, setBlood] = useState('0(I) −');
  const [emg, setEmg] = useState('');
  const [notes, setNotes] = useState('');
  const [savedProfile, setSavedProfile] = useState(null);
  const [formError, setFormError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const namePlaceholder = useRef(NAME_EXAMPLES[Math.floor(Math.random() * NAME_EXAMPLES.length)]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mtb_profile');
      if (raw) {
        const p = JSON.parse(raw);
        setName(p.name || ''); setPhone(p.phone || ''); setBlood(p.blood || '0(I) −');
        setEmg(p.emg || ''); setNotes(p.notes || ''); setSavedProfile(p);
      }
    } catch (e) {}
  }, []);

  const PHONE_RE = /^[0-9+\-\s()]+$/;

  const saveProfile = () => {
    setSavedMsg('');
    if (!name.trim() || !phone.trim() || !emg.trim()) {
      setFormError('Заполните все обязательные поля: ФИО, телефон и контакт близкого.');
      return;
    }
    if (!PHONE_RE.test(phone.trim())) {
      setFormError('Номер телефона может содержать только цифры, пробелы, + и -.');
      return;
    }
    setFormError('');
    const p = { name: name.trim(), phone: phone.trim(), blood, emg: emg.trim(), notes: notes.trim() };
    localStorage.setItem('mtb_profile', JSON.stringify(p));
    setSavedProfile(p);
    setSavedMsg('✓ Профиль сохранён и будет прикрепляться к сигналу.');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  // ---- smartwatch pairing + live pulse ----
  const [watchModel, setWatchModel] = useState(WATCH_MODELS[0]);
  const [watchLinked, setWatchLinked] = useState(false);
  const [linking, setLinking] = useState(false);
  const [pulse, setPulse] = useState(null);
  const [flat, setFlat] = useState(false);
  const [watchAlarm, setWatchAlarm] = useState(null); // {type:'ok'|'bad', text}
  const pulseIntervalRef = useRef(null);

  const linkWatch = () => {
    setLinking(true);
    setTimeout(() => {
      setWatchLinked(true);
      setLinking(false);
      setPulse(74);
      startPulseLoop();
    }, 900);
  };

  const startPulseLoop = () => {
    if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
    pulseIntervalRef.current = setInterval(() => {
      setPulse(prev => {
        if (flat) return Math.max(0, (prev || 0) - 6);
        return 72 + Math.round(Math.sin(Date.now() / 900) * 6) + Math.round(Math.random() * 3 - 1.5);
      });
    }, 700);
  };
  useEffect(() => () => { if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current); }, []);
  useEffect(() => { if (watchLinked) startPulseLoop(); }, [flat]); // eslint-disable-line

  const simDrop = () => {
    if (watchLinked) {
      setWatchAlarm({ type: 'ok', text: `Удар зафиксирован, но пульс ${pulse} bpm — в норме. Ложное срабатывание отменено пульсометром.` });
    } else {
      setWatchAlarm({ type: 'bad', text: 'Удар зафиксирован. Часы не привязаны — маяк не может подтвердить состояние, тревога поднята по умолчанию.' });
      emitUltrasonicSOS();
    }
  };
  const simInjury = () => {
    if (watchLinked) {
      setFlat(true);
      setWatchAlarm({ type: 'bad', text: 'Удар + резкая потеря пульса. ТРЕВОГА: запуск акустического маяка.' });
    } else {
      setWatchAlarm({ type: 'bad', text: 'Удар зафиксирован. Часы не привязаны — тревога поднята по акселерометру.' });
    }
    emitUltrasonicSOS();
  };

  // ---- ultrasonic SOS (unchanged logic) ----
  const emitUltrasonicSOS = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(19500, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(21000, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      setLastImpact(new Date().toLocaleTimeString());
      setStatus('ПАДЕНИЕ ЗАФИКСИРОВАНО! УЛЬТРАЗВУКОВОЙ SOS ОТПРАВЛЕН!');
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!isActive) return;
    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (acc && acc.x) {
        const totalG = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
        if (totalG > 25) emitUltrasonicSOS();
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isActive]);

  // ---- shared styles ----
  const card = { background: '#fff', border: `1px solid ${C.line}`, borderRadius: '20px', padding: '24px' };
  const field = { marginBottom: '14px' };
  const label = { fontSize: '12.5px', color: C.sub, display: 'block', marginBottom: '6px' };
  const inputStyle = { width: '100%', padding: '11px 13px', border: `1px solid ${C.line}`, borderRadius: '9px', fontFamily: 'Inter, sans-serif', fontSize: '14px', background: '#fff', color: C.ink, boxSizing: 'border-box' };
  const btn = { padding: '12px 20px', borderRadius: '999px', fontSize: '13.5px', fontWeight: 600, border: `1px solid ${C.ink}`, background: C.ink, color: '#fff', cursor: 'pointer' };
  const btnOutline = { ...btn, background: 'transparent', color: C.ink };
  const btnGreen = { ...btn, background: C.greenBright, borderColor: C.greenBright, color: '#08210F' };

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100vh', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      <button onClick={onBack} style={{ ...btnOutline, borderColor: C.green, color: C.green, padding: '8px 16px', marginBottom: '20px' }}>
        &larr; Назад на Лендинг
      </button>

      <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* защита + импульс */}
        <div style={{ ...card, textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '22px', fontFamily: "'Fraunces', serif" }}>Режим «Турист»</h2>
          <p style={{ color: C.sub, fontSize: '13px', lineHeight: 1.5 }}>
            Фоновый замок безопасности. При падении телефон автоматически издаст акустический импульс.
          </p>
          <button
            onClick={() => { setIsActive(!isActive); setStatus(isActive ? 'Защита отключена' : 'Защита активна. Попробуйте встряхнуть или уронить телефон.'); }}
            style={{ ...btn, width: '100%', padding: '16px', fontSize: '16px', marginTop: '20px', background: isActive ? C.red : C.greenBright, borderColor: isActive ? C.red : C.greenBright, color: isActive ? '#fff' : '#08210F' }}
          >
            {isActive ? 'Деактивировать Защиту' : 'Активировать Защиту в Горах'}
          </button>
          <button onClick={emitUltrasonicSOS} style={{ ...btnOutline, width: '100%', padding: '12px', fontSize: '13px', marginTop: '10px' }}>
            Тестовый импульс SOS (Ручной запуск)
          </button>
          <div style={{ marginTop: '20px', padding: '14px 16px', background: C.bg, borderRadius: '14px', border: `1px solid ${C.line}`, fontSize: '13px', color: C.green, textAlign: 'left' }}>
            <b>Статус:</b> {status}
            {lastImpact && <div style={{ marginTop: '6px', color: C.sub, fontSize: '11px' }}>Последний импульс: {lastImpact}</div>}
          </div>
        </div>

        {/* профиль */}
        <div style={card}>
          <h3 style={{ fontSize: '17px', fontFamily: "'Fraunces', serif", margin: '0 0 4px' }}>Профиль путешественника</h3>
          <p style={{ color: C.sub, fontSize: '12.5px', lineHeight: 1.5, margin: '0 0 16px' }}>
            Этот пакет прикрепляется к сигналу и приходит на радар спасателя.
          </p>
          <div style={field}><label style={label}>ФИО *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder={`например: ${namePlaceholder.current}`} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div><label style={label}>Телефон *</label>
              <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 707 XXX XX XX" />
            </div>
            <div><label style={label}>Группа крови</label>
              <select style={inputStyle} value={blood} onChange={e => setBlood(e.target.value)}>
                {['0(I) −','0(I) +','A(II) −','A(II) +','B(III) −','B(III) +','AB(IV) −','AB(IV) +'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div style={field}><label style={label}>Контакт близкого (Emergency Contact) *</label>
            <input style={inputStyle} value={emg} onChange={e => setEmg(e.target.value)} placeholder="Aigul Seilova, +7 701 XXX XX XX" />
          </div>
          <div style={field}><label style={label}>Аллергии / особые примечания</label>
            <textarea style={{ ...inputStyle, minHeight: '56px', resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Аллергия на пенициллин, астма" />
          </div>
          <button onClick={saveProfile} style={{ ...btn, width: '100%' }}>Сохранить профиль</button>
          {formError && <div style={{ marginTop: '10px', fontSize: '12.5px', color: C.red, fontWeight: 600 }}>{formError}</div>}
          {savedMsg && <div style={{ marginTop: '10px', fontSize: '12.5px', color: C.green, fontWeight: 600 }}>{savedMsg}</div>}
        </div>

        {/* часы */}
        <div style={card}>
          <h3 style={{ fontSize: '17px', fontFamily: "'Fraunces', serif", margin: '0 0 4px' }}>Привязка умных часов</h3>
          <p style={{ color: C.sub, fontSize: '12.5px', lineHeight: 1.5, margin: '0 0 16px' }}>
            Удар + нормальный пульс — тревога не поднимается. Удар + пульс пропал — включается полная тревога.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <select style={{ ...inputStyle, flex: 1 }} value={watchModel} onChange={e => setWatchModel(e.target.value)}>
              {WATCH_MODELS.map(m => <option key={m}>{m}</option>)}
            </select>
            <button onClick={linkWatch} disabled={linking} style={{ ...btnGreen, whiteSpace: 'nowrap' }}>
              {linking ? 'Подключение…' : watchLinked ? 'Привязано ✓' : 'Привязать'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: C.bg, border: `1px solid ${C.line}`, marginBottom: '14px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: watchLinked ? C.greenBright : C.sub, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{watchLinked ? `Успешно привязано: ${watchModel}` : 'Часы не привязаны'}</div>
              <div style={{ fontSize: '12px', color: C.sub }}>{watchLinked ? 'Пульс синхронизирован по Bluetooth' : 'Акселерометр — единственный источник данных'}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', color: flat ? C.red : C.green }}>{pulse ?? '—'}</div>
              <div style={{ fontSize: '10.5px', color: C.sub, textTransform: 'uppercase' }}>bpm</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={simDrop} style={{ ...btnOutline, flex: 1, minWidth: '160px', fontSize: '12.5px', padding: '10px' }}>Телефон упал из кармана</button>
            <button onClick={simInjury} style={{ ...btnOutline, flex: 1, minWidth: '160px', fontSize: '12.5px', padding: '10px' }}>Удар + пульс пропал</button>
          </div>
          {watchAlarm && (
            <div style={{ marginTop: '12px', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, background: watchAlarm.type === 'ok' ? '#E7F5EC' : '#FBEAE8', color: watchAlarm.type === 'ok' ? C.green : C.red }}>
              {watchAlarm.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
