import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/login.css'
import axios from 'axios'

function Login() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setShowError(false)

    try {
      const response = await axios.post('/api/login', {
        login,
        password
      })
      
      // Сохраняем токен (если бэкенд вернет токен)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
      }
      
      // Если требуется TOTP, перенаправляем на страницу TOTP
      if (response.data.message === 'TOTP required') {
        navigate('/totp')
      } else {
        navigate('/account')
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Ошибка входа'
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
          <h2 className="form-header">Login</h2>

          <div className="form-group">
            <label className="form-label" htmlFor="login">Login</label>
            <input
              className="form-input"
              type="text"
              id="login"
              name="login"
              placeholder="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="password-input">
              <input
                className="form-input form-input-m0"
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              ></span>
            </div>
          </div>

          <button type="submit" className="sign-in-btn">Sign in</button>

          <div className="signup-text">
            Don't have an account yet? <Link className="signup-link" to="/register">Register for free</Link>
          </div>
        </form>
      </div>
    </>
  )
}

export default Login

