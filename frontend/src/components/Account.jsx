import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/account.css';
import axios from 'axios';

function Account() {
  const [username, setUsername] = useState('username');
  const [signupDate, setSignupDate] = useState('07-12-2025');
  const [sessions, setSessions] = useState([]);
  const [totpEnabled, setTotpEnabled] = useState(false); 
  const [showTOTPPopup, setShowTOTPPopup] = useState(false);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false); 
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [codeInputs, setCodeInputs] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Стили попапов 
  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const popupStyle = {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    maxWidth: '400px',
    textAlign: 'center',
  };

  const buttonStyle = {
    marginTop: '20px',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#fff',
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    loadUserData();
    loadSessions();
  }, [navigate]);

  const loadUserData = async () => {
    try {
      const response = await axios.get('/api/user', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setUsername(response.data.username);
      setSignupDate(response.data.signup_date);
      setTotpEnabled(response.data.totp_enabled); 
    } catch (err) {
      console.error('Ошибка загрузки данных пользователя:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const loadSessions = async () => {
    try {
      const response = await axios.get('/api/sessions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setSessions(response.data.sessions || []);
    } catch (err) {
      console.error('Ошибка загрузки сессий:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleEnableTOTP = async () => {
    try {
      const response = await axios.post(
        '/api/totp/setup',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setTotpSecret(response.data.secret);
      setQrCode(response.data.qr_code);
      setShowTOTPPopup(true);
    } catch (err) {
      console.error('Ошибка настройки TOTP:', err);
      alert('Не удалось начать настройку TOTP. Попробуйте позже.');
    }
  };

  const closeAllPopups = () => {
    setShowTOTPPopup(false);
    setShowVerifyPopup(false);
    setTotpSecret('');
    setQrCode('');
    setCodeInputs(['', '', '', '', '', '']);
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value) || value.length > 1) return;

    const newInputs = [...codeInputs];
    newInputs[index] = value;
    setCodeInputs(newInputs);

    if (value && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeInputs[index] && index > 0) {
      const newInputs = [...codeInputs];
      newInputs[index - 1] = '';
      setCodeInputs(newInputs);
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
      }, 0);
    }
  };

  const handleVerifyCode = async () => {
    const code = codeInputs.join('');
    if (code.length !== 6) return;

    try {
      await axios.post(
        '/api/totp/setup/verify',
        { code },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      alert('TOTP успешно подключен');
      setTotpEnabled(true);
      closeAllPopups();
    } catch (err) {
      alert('Неверный код. Попробуйте снова.');
      setCodeInputs(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 0);
    }
  };

  useEffect(() => {
    if (codeInputs.every(digit => digit !== '')) {
      handleVerifyCode();
    }
  }, [codeInputs]);

  const terminateSession = async (sessionId) => {
    try {
      await axios.delete(`/api/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      loadSessions();
    } catch (err) {
      console.error('Ошибка завершения сессии:', err);
    }
  };

  return (
    <>
      <div className="account-page">
        <div className="header">
          <div className="container">
            <h1 className="logo">bezrook</h1>
          </div>
        </div>
        <div className="account-container">
          <img
            src="/img/profile-example.jpg"
            alt="Аватар"
            className="profile-photo"
          />
          <span className="login">{username}</span>
          <span className="signup-date">{signupDate}</span>
        </div>

        {!totpEnabled && (
          <div className="tfa-container">
            <div className="add-tfa" onClick={handleEnableTOTP}>
              <span className="tfa-text">Включить TOTP 2FA</span>
            </div>
          </div>
        )}

        <div className="sessions-container">
          <h2 className="sessions-title">Сессии</h2>
          {sessions.map((session, index) => (
            <div
              key={session.id || index}
              className="session"
              id={session.is_current ? 'currentSession' : ''}
            >
              <span className="session-device">
                {session.device ||
                  `DESKTOP-${Math.random().toString(36).substr(2, 5)}`}
              </span>
              <div className="session-start-time">
                {session.start_time || '14:07 07-12-2025'}
              </div>
              {session.is_current ? (
                <div className="online-indicator">
                  <div className="pulse-circle"></div>
                </div>
              ) : (
                <button
                  className="terminate-session"
                  onClick={() => terminateSession(session.id)}
                  title="Прервать сессию"
                ></button>
              )}
            </div>
          ))}
        </div>

        {/* Попап 1: QR-код */}
        {showTOTPPopup && (
          <div style={modalStyle}>
            <div style={popupStyle}>
              <h2>Настройка TOTP</h2>
              <p>Отсканируйте QR-код в приложении Google Authenticator:</p>
              {qrCode && (
                <img
                  src={qrCode}
                  alt="QR Code"
                  style={{ margin: '20px 0', maxWidth: '100%' }}
                />
              )}
              <p
                style={{
                  marginTop: '20px',
                  fontSize: '14px',
                  wordBreak: 'break-all',
                }}
              >
                Или введите секрет вручную:
                <br />
                <strong>{totpSecret}</strong>
              </p>
              <button
                onClick={closeAllPopups}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#6c757d',
                  marginTop: '10px',
                  marginRight: '5px'
                }}
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setShowTOTPPopup(false);
                  setShowVerifyPopup(true);
                }}
                style={{ ...buttonStyle, backgroundColor: '#125221ff' }}
              >
                Проверить
              </button>
            </div>
          </div>
        )}

        {/* Попап 2: Ввод кода */}
        {showVerifyPopup && (
          <div style={modalStyle}>
            <div
              style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '12px',
                maxWidth: '400px',
                textAlign: 'center',
              }}
            >
              <h2>Подтвердите код</h2>
              <p>Введите 6-значный код из приложения:</p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '20px',
                }}
              >
                {codeInputs.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    id={`code-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    style={{
                      width: '50px',
                      height: '60px',
                      fontSize: '24px',
                      textAlign: 'center',
                      border: '2px solid #ccc',
                      borderRadius: '8px',
                      outline: 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Account;