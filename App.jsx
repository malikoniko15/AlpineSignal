import React, { useState } from 'react';
import Landing from './Landing';
import Tourist from './Tourist'; // убедись, что название файла совпадает
import Radar from './Radar'; // или RadarApp, проверь как называется у тебя

export default function App() {
  // Состояние текущего экрана: 'landing' | 'tourist' | 'radar'
  const [currentScreen, setCurrentScreen] = useState('landing');

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#0D110E' }}>
      
      {/* Кнопка быстрого возврата на главную, когда открыт демо-режим */}
      {currentScreen !== 'landing' && (
        <button
          onClick={() => setCurrentScreen('landing')}
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 9999,
            background: 'rgba(13, 17, 14, 0.85)',
            color: '#fff',
            border: '1px solid #262B27',
            padding: '8px 16px',
            borderRadius: '999px',
            cursor: 'pointer',
            fontSize: '13px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          ← На главный лендинг
        </button>
      )}

      {/* Отрисовка нужного экрана */}
      {currentScreen === 'landing' && (
        <Landing 
          onOpenTourist={() => setCurrentScreen('tourist')} 
          onOpenRadar={() => setCurrentScreen('radar')} 
        />
      )}

      {currentScreen === 'tourist' && (
        <Tourist onBack={() => setCurrentScreen('landing')} />
      )}

      {currentScreen === 'radar' && (
        <Radar onBack={() => setCurrentScreen('landing')} />
      )}

    </div>
  );
}