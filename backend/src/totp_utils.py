import pyotp
import qrcode
from io import BytesIO
import base64


def generate_totp_secret() -> str:
    """Генерирует секретный ключ для TOTP"""
    return pyotp.random_base32()


def generate_qr_code(username: str, secret: str) -> str:
    """Генерирует QR-код для Google Authenticator"""
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=username,
        issuer_name="bezrook"
    )
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Конвертируем изображение в base64
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def verify_totp_code(secret: str, code: str) -> bool:
    """Проверяет TOTP код"""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)  # valid_window=1 позволяем небольшую погрешность во времени

