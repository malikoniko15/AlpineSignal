import React, { useEffect, useRef, useState } from 'react';

export default function Landing({ onOpenTourist, onOpenRadar }) {
  // Refs для интерактивных элементов
  const gorgeRef = useRef(null);
  const spectrumRef = useRef(null);

  // State для Калькулятора
  const [depth, setDepth] = useState(150);
  const [count, setCount] = useState(5);

  // State для звукового тона
  const [isPlayingTone, setIsPlayingTone] = useState(false);
  const toneAudioRef = useRef(null);

  // 1. Анимация горных ущелий (Interactive Gorge Canvas)
  useEffect(() => {
    const gorge = gorgeRef.current;
    if (!gorge) return;
    const gctx = gorge.getContext('2d');
    
    let phones = [];
    let fallen = null;
    let ripple = 0;
    let animId = null;

    const layout = () => {
      const w = gorge.clientWidth;
      const h = gorge.height;
      gorge.width = w;
      gorge.height = h;
      phones = [
        { x: w * 0.18, y: h * 0.62 },
        { x: w * 0.32, y: h * 0.42 },
        { x: w * 0.5,  y: h * 0.7 },
        { x: w * 0.63, y: h * 0.38 },
        { x: w * 0.78, y: h * 0.6 },
        { x: w * 0.88, y: h * 0.34 }
      ];
      drawScene();
    };

    const drawMountains = (w, h) => {
      gctx.fillStyle = '#DCE7DE';
      gctx.beginPath(); gctx.moveTo(0, h); gctx.lineTo(0, h * 0.55);
      gctx.lineTo(w * 0.2, h * 0.32); gctx.lineTo(w * 0.4, h * 0.5); gctx.lineTo(w * 0.6, h * 0.22);
      gctx.lineTo(w * 0.8, h * 0.46); gctx.lineTo(w, h * 0.3); gctx.lineTo(w, h); gctx.closePath(); gctx.fill();

      gctx.fillStyle = '#B9CBBE';
      gctx.beginPath(); gctx.moveTo(0, h); gctx.lineTo(0, h * 0.72);
      gctx.lineTo(w * 0.25, h * 0.5); gctx.lineTo(w * 0.5, h * 0.78); gctx.lineTo(w * 0.7, h * 0.48);
      gctx.lineTo(w, h * 0.68); gctx.lineTo(w, h); gctx.closePath(); gctx.fill();

      gctx.fillStyle = '#0F2318';
      gctx.beginPath(); gctx.moveTo(0, h); gctx.lineTo(0, h * 0.86);
      gctx.lineTo(w * 0.3, h * 0.7); gctx.lineTo(w * 0.55, h * 0.92); gctx.lineTo(w * 0.75, h * 0.68);
      gctx.lineTo(w, h * 0.84); gctx.lineTo(w, h); gctx.closePath(); gctx.fill();
    };

    const drawScene = () => {
      const w = gorge.width;
      const h = gorge.height;
      gctx.clearRect(0, 0, w, h);
      drawMountains(w, h);

      phones.forEach(p => {
        const dist = fallen ? Math.hypot(p.x - fallen.x, p.y - fallen.y) : 9999;
        const isHeard = fallen && ripple > dist;
        gctx.beginPath();
        gctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        gctx.fillStyle = isHeard ? '#3FCB7C' : '#6C7B71';
        gctx.fill();

        if (isHeard) {
          gctx.strokeStyle = 'rgba(63,203,124,.4)';
          gctx.lineWidth = 5;
          gctx.beginPath();
          gctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
          gctx.stroke();
        }
      });

      if (fallen) {
        gctx.beginPath();
        gctx.arc(fallen.x, fallen.y, ripple, 0, Math.PI * 2);
        gctx.strokeStyle = 'rgba(15,35,24,.25)';
        gctx.lineWidth = 2;
        gctx.stroke();

        gctx.beginPath();
        gctx.arc(fallen.x, fallen.y, 8, 0, Math.PI * 2);
        gctx.fillStyle = '#0D110E';
        gctx.fill();
      }
    };

    const updateReadout = () => {
      const heard = phones.filter(p => fallen && ripple > Math.hypot(p.x - fallen.x, p.y - fallen.y)).length;
      const elHeard = document.getElementById('rd-heard');
      const elAcc = document.getElementById('rd-acc');
      const elTime = document.getElementById('rd-time');

      if (elHeard) elHeard.textContent = heard;
      if (elAcc) elAcc.textContent = heard >= 3 ? (85 + heard).toFixed(0) + '%' : heard > 0 ? 'частично' : '—';
      if (elTime) elTime.textContent = heard >= 3 ? (1.2 + ripple * 0.002).toFixed(1) + ' с' : '—';
    };

    const handleClick = (e) => {
      const r = gorge.getBoundingClientRect();
      fallen = {
        x: (e.clientX - r.left) * (gorge.width / r.width),
        y: (e.clientY - r.top) * (gorge.height / r.height)
      };
      ripple = 0;
      if (animId) cancelAnimationFrame(animId);

      const anim = () => {
        ripple += 6;
        drawScene();
        updateReadout();
        if (ripple < gorge.width * 1.2) animId = requestAnimationFrame(anim);
      };
      anim();
    };

    gorge.addEventListener('click', handleClick);
    window.addEventListener('resize', layout);
    layout();

    return () => {
      gorge.removeEventListener('click', handleClick);
      window.removeEventListener('resize', layout);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // 2. Анимация Спектрометра
  useEffect(() => {
    const canvas = spectrumRef.current;
    if (!canvas) return;
    const sctx = canvas.getContext('2d');
    let noisePhase = 0;
    let animId = null;

    const drawSpectrum = () => {
      const w = canvas.width = canvas.clientWidth;
      const h = canvas.height;
      sctx.clearRect(0, 0, w, h);
      sctx.strokeStyle = '#3FCB7C';
      sctx.lineWidth = 1.5;
      sctx.beginPath();

      for (let x = 0; x < w * 0.72; x++) {
        const y = h * 0.75 + Math.sin(x * 0.15 + noisePhase) * 8 * Math.random() * 0.6 + Math.sin(x * 0.03) * 10;
        x === 0 ? sctx.moveTo(x, y) : sctx.lineTo(x, y);
      }
      sctx.stroke();

      const px = w * 0.86;
      sctx.beginPath();
      sctx.moveTo(px - 2, h * 0.85);
      sctx.lineTo(px, h * 0.08);
      sctx.lineTo(px + 2, h * 0.85);
      sctx.closePath();
      sctx.fillStyle = '#3FCB7C';
      sctx.fill();

      sctx.fillStyle = '#B9C6BE';
      sctx.font = '11px Inter';
      sctx.fillText('шум ветра / реки', 10, h - 8);
      sctx.fillStyle = '#3FCB7C';
      sctx.fillText('21 000 Гц', px - 24, h * 0.06);

      noisePhase += 0.05;
      animId = requestAnimationFrame(drawSpectrum);
    };

    drawSpectrum();
    return () => { if (animId) cancelAnimationFrame(animId); };
  }, []);

  // 3. Воспроизведение звука 21 кГц
  const handleToggleTone = () => {
    if (!isPlayingTone) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = 19500;
      g.gain.value = 0.06;
      osc.connect(g).connect(ctx.destination);
      osc.start();
      toneAudioRef.current = { ctx, osc };
      setIsPlayingTone(true);
    } else {
      if (toneAudioRef.current) {
        toneAudioRef.current.osc.stop();
        toneAudioRef.current.ctx.close();
      }
      setIsPlayingTone(false);
    }
  };

  // Расчет значений калькулятора
  const calcAcc = Math.max(20, Math.min(97, 42 + count * 4.2 - depth / 14)).toFixed(0);
  const calcTime = Math.max(1.1, 6 - count * 0.22 + depth / 220).toFixed(1);
  const calcHops = Math.max(1, Math.ceil(depth / 180) + Math.max(0, 3 - Math.floor(count / 4)));

  return (
    <div style={{ background: '#FAFAF7', color: '#0D110E', fontFamily: "'Inter', sans-serif", minHeight: '100vh', width: '100%' }}>
      
      {/* NAVBAR */}
      <div className="navbar" style={{ maxWidth: '1080px', margin: '18px auto 0', padding: '0 24px' }}>
        <div style={{ background: '#0F2318', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 10px 12px 22px' }}>
          <div style={{ color: '#fff', fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '16px' }}>Acoustic Mesh</div>
          <nav style={{ display: 'flex', gap: '22px' }}>
            <a href="#how" style={{ color: '#C9D6CE', textDecoration: 'none', fontSize: '13px' }}>Как это работает</a>
            <a href="#spectrum" style={{ color: '#C9D6CE', textDecoration: 'none', fontSize: '13px' }}>Спектр</a>
            <a href="#calc" style={{ color: '#C9D6CE', textDecoration: 'none', fontSize: '13px' }}>Калькулятор</a>
            <a href="#demo-choice" style={{ color: '#3FCB7C', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>Демо-Версии</a>
          </nav>
          <a href="#demo-choice" style={{ background: '#3FCB7C', color: '#08210F', padding: '9px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Запустить Демо
          </a>
        </div>
      </div>

      {/* HERO SECTION */}
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '56px 24px 0' }}>
        <div style={{ fontSize: '11.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#1F4433', fontWeight: 600, marginBottom: '10px' }}>
          Поиск людей в горах — со связью и без
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 5.4vw, 54px)', lineHeight: 1.06, maxWidth: '16ch', margin: '0 0 16px', color: '#0D110E', fontWeight: 600 }}>
          Децентрализованный поиск в горах через ультразвуковую эхолокацию.
        </h1>
        <p style={{ color: '#5B6560', fontSize: '15.5px', lineHeight: 1.65, maxWidth: '56ch', margin: '18px 0 26px' }}>
          Работает в любых условиях: если связи нет — телефоны туристов превращаются в пассивную акустическую mesh-сеть, передающую сигналы бедствия без интернета и GPS.
        </p>
        
        {/* КНОПКИ БЫСТРОГО ЗАПУСКА ДЕМО */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '44px' }}>
          <button onClick={onOpenTourist} style={{ padding: '14px 24px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: '#0D110E', color: '#fff', border: 'none' }}>
            Запустить Режим Туриста
          </button>
          <button onClick={onOpenRadar} style={{ padding: '14px 24px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#0D110E', border: '1px solid #0D110E' }}>
            Запустить Радар
          </button>
        </div>

        {/* INTERACTIVE MOUNTAIN DEMO */}
        <div style={{ borderRadius: '22px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(180deg,#EAF1EA 0%, #F6F5EF 55%)' }}>
          <div style={{ position: 'absolute', top: '18px', left: '22px', color: '#0F2318', fontSize: '12.5px', background: 'rgba(255,255,255,.75)', padding: '8px 14px', borderRadius: '999px' }}>
            Кликните по ущелью — турист падает
          </div>
          <canvas ref={gorgeRef} height="360" style={{ display: 'block', width: '100%', cursor: 'crosshair' }}></canvas>
          <div style={{ position: 'absolute', bottom: '18px', left: '22px', right: '22px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(13,17,14,.85)', color: '#fff', padding: '9px 14px', borderRadius: '12px', fontSize: '12.5px' }}>Услышали сигнал: <b id="rd-heard" style={{ color: '#3FCB7C' }}>0</b> / 6</div>
            <div style={{ background: 'rgba(13,17,14,.85)', color: '#fff', padding: '9px 14px', borderRadius: '12px', fontSize: '12.5px' }}>Точность триангуляции: <b id="rd-acc" style={{ color: '#3FCB7C' }}>—</b></div>
            <div style={{ background: 'rgba(13,17,14,.85)', color: '#fff', padding: '9px 14px', borderRadius: '12px', fontSize: '12.5px' }}>Время до обнаружения: <b id="rd-time" style={{ color: '#3FCB7C' }}>—</b></div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" style={{ maxWidth: '1080px', margin: '0 auto', padding: '70px 24px' }}>
        <div style={{ fontSize: '11.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#1F4433', fontWeight: 600, marginBottom: '10px', textAlign: 'center' }}>Как это работает</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '32px', margin: 0, color: '#0D110E', textAlign: 'center' }}>От падения до сигнала спасателям</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginTop: '34px' }}>
          <div style={{ borderTop: '2px solid #0D110E', paddingTop: '14px' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', color: '#1F4433' }}>01</div>
            <h3 style={{ fontSize: '16.5px', margin: '8px 0 6px', color: '#0D110E' }}>Падение и детекция</h3>
            <p style={{ color: '#5B6560', fontSize: '13px', lineHeight: 1.55 }}>Акселерометр смартфона фиксирует резкий удар и неподвижность.</p>
          </div>
          <div style={{ borderTop: '2px solid #0D110E', paddingTop: '14px' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', color: '#1F4433' }}>02</div>
            <h3 style={{ fontSize: '16.5px', margin: '8px 0 6px', color: '#0D110E' }}>Акустический выстрел</h3>
            <p style={{ color: '#5B6560', fontSize: '13px', lineHeight: 1.55 }}>Телефон излучает неслышимый ультразвуковой chirp-импульс (19.5–21 кГц).</p>
          </div>
          <div style={{ borderTop: '2px solid #0D110E', paddingTop: '14px' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', color: '#1F4433' }}>03</div>
            <h3 style={{ fontSize: '16.5px', margin: '8px 0 6px', color: '#0D110E' }}>Пассивный mesh</h3>
            <p style={{ color: '#5B6560', fontSize: '13px', lineHeight: 1.55 }}>Смартфоны вокруг ловят сигнал микрофоном и фиксируют разницу времени (TDoA).</p>
          </div>
          <div style={{ borderTop: '2px solid #0D110E', paddingTop: '14px' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', color: '#1F4433' }}>04</div>
            <h3 style={{ fontSize: '16.5px', margin: '8px 0 6px', color: '#0D110E' }}>Спасательный след</h3>
            <p style={{ color: '#5B6560', fontSize: '13px', lineHeight: 1.55 }}>Данные ретранслируются по цепочке до первого выхода в сеть или спасателей.</p>
          </div>
        </div>
      </div>

      {/* SPECTRUM SIMULATOR */}
      <div id="spectrum" style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 24px 70px' }}>
        <div style={{ background: '#0F2318', borderRadius: '22px', padding: '34px 28px', color: '#fff' }}>
          <div style={{ fontSize: '11.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#3FCB7C', fontWeight: 600, marginBottom: '10px' }}>Симулятор звукового спектра</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', margin: '0 0 10px', color: '#fff' }}>Почему сигнал слышен даже в бурю</h2>
          <p style={{ color: '#B9C6BE', fontSize: '15.5px', lineHeight: 1.65, margin: 0 }}>
            Слева — шум ветра и реки в низких частотах. Справа — чистый пик нашего импульса на 21 000 Гц, изолированный от природного шума.
          </p>
          <canvas ref={spectrumRef} height="180" style={{ width: '100%', marginTop: '20px', borderRadius: '12px', background: '#0A1B12' }}></canvas>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button onClick={handleToggleTone} style={{ background: '#3FCB7C', color: '#08210F', border: 'none', padding: '10px 20px', borderRadius: '999px', fontWeight: 'bold', cursor: 'pointer' }}>
              {isPlayingTone ? 'Остановить' : 'Послушать 21 кГц'}
            </button>
            <span style={{ fontSize: '12.5px', color: '#93A29B' }}>
              {isPlayingTone ? 'Звучит ~19.5 кГц (слегка понижено для динамиков)' : 'Звук почти не слышен человеку, но идеально ловится микрофоном.'}
            </span>
          </div>
        </div>
      </div>

      {/* CALCULATOR */}
      <div id="calc" style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 24px 70px' }}>
        <div style={{ fontSize: '11.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#1F4433', fontWeight: 600, marginBottom: '10px', textAlign: 'center' }}>Интерактивный калькулятор</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '32px', margin: 0, color: '#0D110E', textAlign: 'center' }}>Оцените точность обнаружения</h2>
        <div style={{ border: '1px solid #DEDCD3', borderRadius: '20px', padding: '30px', marginTop: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '26px', marginBottom: '8px' }}>
            <div>
              <label style={{ fontSize: '12.5px', color: '#5B6560', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                Глубина ущелья <b>{depth} м</b>
              </label>
              <input type="range" min="0" max="500" value={depth} onChange={(e) => setDepth(+e.target.value)} style={{ width: '100%', accentColor: '#1F4433' }} />
            </div>
            <div>
              <label style={{ fontSize: '12.5px', color: '#5B6560', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                Туристов поблизости <b>{count}</b>
              </label>
              <input type="range" min="0" max="20" value={count} onChange={(e) => setCount(+e.target.value)} style={{ width: '100%', accentColor: '#1F4433' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '22px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '160px', background: '#FAFAF7', border: '1px solid #DEDCD3', borderRadius: '14px', padding: '16px 18px' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '30px', color: '#1F4433' }}>{calcAcc}%</div>
              <div style={{ fontSize: '11.5px', color: '#5B6560', textTransform: 'uppercase', letterSpacing: '.06em' }}>Точность триангуляции</div>
            </div>
            <div style={{ flex: 1, minWidth: '160px', background: '#FAFAF7', border: '1px solid #DEDCD3', borderRadius: '14px', padding: '16px 18px' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '30px', color: '#1F4433' }}>{calcTime} с</div>
              <div style={{ fontSize: '11.5px', color: '#5B6560', textTransform: 'uppercase', letterSpacing: '.06em' }}>Скорость обнаружения</div>
            </div>
            <div style={{ flex: 1, minWidth: '160px', background: '#FAFAF7', border: '1px solid #DEDCD3', borderRadius: '14px', padding: '16px 18px' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '30px', color: '#1F4433' }}>{calcHops}</div>
              <div style={{ fontSize: '11.5px', color: '#5B6560', textTransform: 'uppercase', letterSpacing: '.06em' }}>Ретрансляций до связи</div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer id="demo-choice" style={{ background: '#0D110E', color: '#fff', width: '100%', padding: '60px 0 40px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: '32px', fontFamily: "'Fraunces', serif", marginBottom: '10px' }}>
            Интерактивное Демо 
          </h2>
          <p style={{ color: '#8A938D', fontSize: '15px', maxWidth: '500px', margin: '0 auto 28px', textAlign: 'center' }}>
            Выберите режим работы веб-приложения для презентации. Работает автономно в браузере без интернета!
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', width: '100%', maxWidth: '680px', justifyContent: 'center' }}>
            {/* КАРТОЧКА ТУРИСТА */}
            <div style={{ background: '#161A17', border: '1px solid #262B27', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 6px' }}>Приложение Туриста</h3>
                <p style={{ color: '#8A938D', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                  Автоматический детектор падений на акселерометре. Выстреливает 21 кГц при ударе.
                </p>
              </div>
              <button onClick={onOpenTourist} style={{ marginTop: '20px', background: '#3FCB7C', color: '#08210F', border: 'none', padding: '12px', borderRadius: '99px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                Открыть «Турист» &rarr;
              </button>
            </div>

            {/* КАРТОЧКА РАДАРА */}
            <div style={{ background: '#161A17', border: '1px solid #262B27', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 6px' }}>Радар Спасателя</h3>
                <p style={{ color: '#8A938D', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                  Пассивный приёмник спектра. Ловит импульс бедствия и моментально фиксирует SOS.
                </p>
              </div>
              <button onClick={onOpenRadar} style={{ marginTop: '20px', background: '#3FCB7C', color: '#08210F', border: 'none', padding: '12px', borderRadius: '99px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                Открыть «Радар» &rarr;
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginTop: '50px', paddingTop: '24px', borderTop: '1px solid #262B27', fontSize: '12.5px', color: '#8A938D', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            <span>Acoustic Mesh · Almaty 2026</span>
            <span>Digital Paws Team</span>
          </div>
        </div>
      </footer>

    </div>
  );
}