import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/account.css'
import axios from 'axios'

function Account() {
  const [username, setUsername] = useState('username')
  const [signupDate, setSignupDate] = useState('07-12-2025')
  const [sessions, setSessions] = useState([])
  const [showTOTPPopup, setShowTOTPPopup] = useState(false)
  const [totpSecret, setTotpSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Проверяем наличие токена
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    
    // Загружаем данные пользователя
    loadUserData()
    loadSessions()
  }, [navigate])

  const loadUserData = async () => {
    try {
      const response = await axios.get('/api/user', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      setUsername(response.data.username)
      setSignupDate(response.data.signup_date)
    } catch (err) {
      console.error('Ошибка загрузки данных пользователя:', err)
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
      }
    }
  }

  const loadSessions = async () => {
    try {
      const response = await axios.get('/api/sessions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      setSessions(response.data.sessions || [])
    } catch (err) {
      console.error('Ошибка загрузки сессий:', err)
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
      }
    }
  }

  const handleEnableTOTP = async () => {
    try {
      const response = await axios.post('/api/totp/setup', {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      setTotpSecret(response.data.secret)
      setQrCode(response.data.qr_code)
      setShowTOTPPopup(true)
    } catch (err) {
      console.error('Ошибка настройки TOTP:', err)
    }
  }

  const closeTOTPPopup = () => {
    setShowTOTPPopup(false)
    setTotpSecret('')
    setQrCode('')
  }

  const terminateSession = async (sessionId) => {
    try {
      await axios.delete(`/api/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      loadSessions()
    } catch (err) {
      console.error('Ошибка завершения сессии:', err)
    }
  }

  return (
    <>
      <div className="header">
        <div className="container">
          <h1 className="logo">bezrook</h1>
        </div>
      </div>
      <div className="account-container">
        <img src="/img/profile-example.jpg" alt="Аватар" className="profile-photo" />
        <span className="login">{username}</span>
        <span className="signup-date">{signupDate}</span>
      </div>
      <div className="tfa-container">
        <div className="add-tfa" onClick={handleEnableTOTP}>
          <span className="tfa-text">Включить TOTP 2FA</span>
        </div>
      </div>
      <div className="sessions-container">
        <h2 className="sessions-title">Сессии</h2>
        {sessions.map((session, index) => (
          <div key={session.id || index} className="session" id={session.is_current ? "currentSession" : ""}>
            <span className="session-device">{session.device || `DESKTOP-${Math.random().toString(36).substr(2, 5)}`}</span>
            <div className="session-start-time">{session.start_time || '14:07 07-12-2025'}</div>
            {session.is_current ? (
              <div className="online-indicator">
                <div className="pulse-circle"></div>
              </div>
            ) : (
              <button
                className="terminate-session"
                onClick={() => terminateSession(session.id)}
              ></button>
            )}
          </div>
        ))}
      </div>

      {showTOTPPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '12px',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h2>Настройка TOTP</h2>
            <p>Отсканируйте QR-код в приложении Google Authenticator:</p>
            {qrCode && (
              <img src={qrCode} alt="QR Code" style={{ margin: '20px 0', maxWidth: '100%' }} />
            )}
            <p style={{ marginTop: '20px', fontSize: '14px', wordBreak: 'break-all' }}>
              Или введите секрет вручную:<br />
              <strong>{totpSecret}</strong>
            </p>
            <button
              onClick={closeTOTPPopup}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Account

