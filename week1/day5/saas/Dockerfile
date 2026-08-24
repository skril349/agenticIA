# Etapa 1: construir los archivos estáticos de Next.js
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copiamos los archivos de dependencias primero (mejor caché)
COPY package*.json ./
RUN npm ci

# Copiamos el resto del frontend
COPY . .

# Pasamos la publishable key al build (es pública por diseño)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Generamos la exportación estática (carpeta out)
RUN npm run build

# Etapa 2: contenedor final de Python
FROM python:3.12-slim

WORKDIR /app

# Dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Servidor FastAPI
COPY api/server.py .

# Archivos estáticos generados por Next.js
COPY --from=frontend-builder /app/out ./static

# Health check para App Runner
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# FastAPI escuchará en el puerto 8000
EXPOSE 8000

# Comando de arranque
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]