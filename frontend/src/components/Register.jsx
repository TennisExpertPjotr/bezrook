import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/login.css'
import axios from 'axios'

function Register() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRep, setPasswordRep] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordRep, setShowPasswordRep] = useState(false)
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)
  const navigate = useNavigate()

  // login validation
  const validateLogin = (lgn) => {
    if (lgn.length < 3) return "Логин должен содержать не менее 3 символов.";

    const allowedPattern = /^[a-zA-Z0-9.\-]+$/;
    if (!allowedPattern.test(lgn)) {
      return "Логин может содержать только латинские буквы, цифры, точку и тире.";
    }
    return null;
  }

  // password validation
  const validatePassword = (pwd) => {
    if (pwd.length < 10) return "Пароль должен содержать не менее 10 символов."
    if (!/[a-z]/.test(pwd)) return "Пароль должен содержать хотя бы одну строчную букву."
    if (!/[A-Z]/.test(pwd)) return "Пароль должен содержать хотя бы одну заглавную букву."
    if (!/\d/.test(pwd)) return "Пароль должен содержать хотя бы одну цифру."
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) 
      return "Пароль должен содержать хотя бы один спецсимвол (!@#$%^&* и др.)."
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setShowError(false)

    let error = null

    // password check
    const pwdError = validatePassword(password)
    if (pwdError) {
      error = pwdError
    }

    // login check
    const lgnError = validateLogin(login)
    if (lgnError) {
      error = lgnError
    }

    // password coincidence check
    else if (password !== passwordRep) {
      error = "Пароли не совпадают."
    }

    if (error) {
      setError(error)
      setShowError(true)
      setTimeout(() => {
        setShowError(false)
      }, 5000)
      return
    }

    try {
      const response = await axios.post('/api/register', {
        login,
        password
      })
      
      if (response.data.message === 'user создан') {
        navigate('/login')
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Ошибка регистрации'
      setError(errorMessage)
      setShowError(true)
      
      setTimeout(() => {
        setShowError(false)
      }, 5000)
    }
  }

  const closeError = () => {
    setShowError(false)
  }

  return (
    <>
      {showError && (
        <div className={`error-container ${showError ? 'show' : ''}`}>
          <span className="ttl running" style={{ '--duration': '5s' }}></span>
          <p className="error-message">{error}</p>
          <button className="close-btn" onClick={closeError} aria-label="Закрыть"></button>
        </div>
      )}
      <div className="login-container">
        <h1 className="logo">bezrook</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="form-header">Sign Up</h2>

          <div className="form-group">
            <label className="form-label" htmlFor="login">Login</label>
            <input
              className="form-input"
              type="text"
              id="login"
              name="login"
              placeholder="username"
              value={login}
              onChange={(e) => {
                setLogin(e.target.value)
                setShowError(false)
              }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="password-input-1">
              <input
                className="form-input form-input-m0"
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setShowError(false)
                }}
                required
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              ></span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="passwordRep">Password</label>
            <div className="password-input">
              <input
                className="form-input form-input-m0"
                type={showPasswordRep ? 'text' : 'password'}
                id="passwordRep"
                name="password-rep"
                placeholder="password"
                value={passwordRep}
                onChange={(e) => {
                  setPasswordRep(e.target.value)
                  setShowError(false)
                }}
                required
              />
              <span
                className="toggle-password"
                onClick={() => setShowPasswordRep(!showPasswordRep)}
              ></span>
            </div>
          </div>

          <button type="submit" className="sign-in-btn">Sign Up</button>

          <div className="signup-text">
            Already have an account? <Link className="signup-link" to="/login">Login</Link>
          </div>
        </form>
      </div>
    </>
  )
}

export default Register

