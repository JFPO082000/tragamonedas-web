from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from decimal import Decimal
import random
import os

# Importar módulos de base de datos y autenticación
from database import get_db, test_connection
from models import Usuario, Saldo
from auth import verify_password, create_access_token, get_current_user

app = FastAPI()

# PERMITIR CUALQUIER ORIGEN (web + app inventor)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SERVIR CARPETA STATIC
app.mount("/static", StaticFiles(directory="static"), name="static")

# Símbolos
SYMBOLS = ["🍒", "🍋", "🍇", "🔔", "⭐", "7️⃣"]

PAYTABLE = {
    "🍒": 5,
    "🍋": 4,
    "🍇": 6,
    "🔔": 8,
    "⭐": 10,
    "7️⃣": 20,
}

# ========== MODELOS DE PYDANTIC ==========

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

class SaldoResponse(BaseModel):
    saldo: float
    usuario: dict

class SpinRequest(BaseModel):
    bet: int

class SpinResponse(BaseModel):
    grid: list
    win: int
    nuevo_saldo: float

# ========== ENDPOINTS DE AUTENTICACIÓN ==========

@app.post("/api/auth/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login con email y password"""
    # Buscar usuario por email
    user = db.query(Usuario).filter(Usuario.email == credentials.email).first()
    
    if not user or not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Verificar password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Crear token JWT
    token = create_access_token({
        "sub": str(user.id_usuario),
        "email": user.email
    })
    
    return LoginResponse(
        token=token,
        user={
            "id_usuario": user.id_usuario,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "email": user.email
        }
    )

# ========== ENDPOINTS DE SALDO ==========

@app.get("/api/saldo", response_model=SaldoResponse)
def get_saldo(current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtener saldo actual del usuario autenticado"""
    saldo = db.query(Saldo).filter(Saldo.id_usuario == current_user.id_usuario).first()
    
    if not saldo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saldo no encontrado"
        )
    
    return SaldoResponse(
        saldo=float(saldo.saldo_actual),
        usuario={
            "nombre": current_user.nombre,
            "apellido": current_user.apellido
        }
    )

# ========== ENDPOINTS DEL JUEGO ==========

@app.get("/")
def serve_lobby(request: Request, response: Response, user_email: str = None, db: Session = Depends(get_db)):
    """
    Ruta raíz inteligente:
    - Si recibe ?user_email=... (App Inventor): Auto-login y REDIRECT a /game/slots.
    - Si NO recibe user_email (Web): Sirve lobby.html.
    """
    # 1. Lógica de App Inventor (Auto-login + Redirect)
    if user_email:
        print(f"🔌 Conexión desde App Inventor para: {user_email}")
        
        # Buscar usuario en la BD
        user = db.query(Usuario).filter(Usuario.email == user_email).first()
        
        if user:
            # Crear Token
            token = create_access_token({
                "sub": str(user.id_usuario),
                "email": user.email
            })
            
            # Redirigir DIRECTAMENTE al juego de slots
            # Usamos RedirectResponse pero necesitamos setear la cookie también
            from fastapi.responses import RedirectResponse
            redirect_response = RedirectResponse(url="/game/slots", status_code=302)
            
            # Inyectar Token en la Cookie
            redirect_response.set_cookie(
                key="access_token",
                value=token,
                httponly=True,
                samesite="lax"
            )
            print(f"✅ Token creado y redirigiendo a Slots para {user_email}")
            return redirect_response
            
    # 2. Lógica Web Normal (Lobby)
    return FileResponse("static/lobby.html")

@app.get("/game/slots")
def serve_slots():
    """Sirve el juego de Tragamonedas (antiguo index.html)"""
    return FileResponse("static/slots.html")

@app.get("/game/blackjack")
def serve_blackjack():
    """Placeholder para Blackjack"""
    # Si tienes el archivo, cámbialo aquí. Por ahora redirige al lobby o muestra un mensaje.
    return Response(content="<h1>Próximamente: Blackjack</h1><a href='/'>Volver al Lobby</a>", media_type="text/html")

@app.get("/game/roulette")
def serve_roulette():
    """Placeholder para Ruleta"""
    return Response(content="<h1>Próximamente: Ruleta</h1><a href='/'>Volver al Lobby</a>", media_type="text/html")

def generate_grid():
    return [[random.choice(SYMBOLS) for _ in range(3)] for _ in range(3)]

def calc_payout(grid, bet):
    total = 0

    # Líneas horizontales
    for row in grid:
        if row[0] == row[1] == row[2]:
            total += bet * PAYTABLE[row[0]]

    # Diagonal principal
    if grid[0][0] == grid[1][1] == grid[2][2]:
        total += bet * PAYTABLE[grid[0][0]]

    # Diagonal inversa
    if grid[0][2] == grid[1][1] == grid[2][0]:
        total += bet * PAYTABLE[grid[0][2]]

    return total

@app.post("/spin", response_model=SpinResponse)
def spin(
    req: SpinRequest, 
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spin con autenticación y actualización de saldo en DB
    """
    bet = max(1, min(req.bet, 10000))
    
    # Obtener saldo actual de la base de datos
    saldo_obj = db.query(Saldo).filter(Saldo.id_usuario == current_user.id_usuario).first()
    
    if not saldo_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saldo no encontrado"
        )
    
    saldo_actual = float(saldo_obj.saldo_actual)
    
    # Validar saldo suficiente
    if saldo_actual < bet:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Saldo insuficiente"
        )
    
    # Descontar apuesta
    nuevo_saldo = saldo_actual - bet
    
    # Generar resultado
    grid = generate_grid()
    win = calc_payout(grid, bet)
    
    # Agregar ganancia
    nuevo_saldo += win
    
    # Actualizar saldo en la base de datos
    saldo_obj.saldo_actual = Decimal(str(nuevo_saldo))
    db.commit()
    db.refresh(saldo_obj)
    
    return SpinResponse(
        grid=grid,
        win=win,
        nuevo_saldo=float(saldo_obj.saldo_actual)
    )

@app.post("/reel")
def get_reel(req: dict):
    """Obtener símbolos para un rodillo individual"""
    reel_symbols = [random.choice(SYMBOLS) for _ in range(3)]
    return {"symbols": reel_symbols}

# ========== STARTUP ==========

@app.on_event("startup")
def startup_event():
    """Verificar conexión a base de datos al iniciar"""
    print("🚀 Iniciando aplicación...")
    test_connection()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

