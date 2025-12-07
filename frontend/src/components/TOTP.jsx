import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/login.css'
import '../styles/totp.css'
import axios from 'axios'

function TOTP() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRefs = useRef([])
  const navigate = useNavigate()

  useEffect(() => {
    // Проверяем наличие токена
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [navigate])

  const handleInput = (index, value) => {
    if (/^\d$/.test(value)) {
      const newDigits = [...digits]
      newDigits[index] = value
      setDigits(newDigits)

      if (index < digits.length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    } else if (value === '') {
      const newDigits = [...digits]
      newDigits[index] = ''
      setDigits(newDigits)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    const newDigits = pastedData.split('').map(char => /^\d$/.test(char) ? char : '')
    setDigits([...newDigits, ...Array(6 - newDigits.length).fill('')])
    
    const nextEmptyIndex = newDigits.length < 6 ? newDigits.length : 5
    inputRefs.current[nextEmptyIndex]?.focus()
  }

  const handleSubmit = useCallback(async (code) => {
    if (isSubmitting) return
    
    if (code.length !== 6) {
      setError('Введите 6-значный код')
      setShowError(true)
      setTimeout(() => setShowError(false), 5000)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await axios.post('/api/totp/verify', {
        code
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // Если успешно, перенаправляем на account
      if (response.data.success) {
        navigate('/account')
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Неверный код'
      setError(errorMessage)
      setShowError(true)
      setTimeout(() => setShowError(false), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, navigate])

  useEffect(() => {
    const code = digits.join('')
    if (code.length === 6 && !isSubmitting) {
      handleSubmit(code)
    }
  }, [digits, handleSubmit, isSubmitting])

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
        <form className="totp-form" onSubmit={(e) => e.preventDefault()}>
          <h2 className="form-header">TOTP</h2>

          <div className="digits-container">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                className="digit-input"
                value={digit}
                onChange={(e) => handleInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                maxLength={1}
                inputMode="numeric"
              />
            ))}
          </div>
        </form>
      </div>
    </>
  )
}

export default TOTP

