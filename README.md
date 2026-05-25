# Chatbot Inteligente — Centro de Competencias Digitales (CCD)
## Universidad Autónoma de Bucaramanga — UNAB

> Sistema de chatbot inteligente basado en arquitectura RAG (Retrieval Augmented Generation) que permite a los estudiantes consultar información del CCD, su progreso académico, oferta de cursos y calendario de eventos mediante lenguaje natural.

---

## Tabla de contenidos

- [Arquitectura del sistema](#arquitectura)
- [Requisitos previos](#requisitos)
- [Componente 1 — JupyterHub (API RAG)](#jupyterhub)
- [Componente 2 — Workflows n8n](#n8n)
- [Componente 3 — App React Native](#app)
- [Cómo ejecutar el sistema completo](#ejecucion)
- [Estructura de la base de datos](#base-de-datos)
- [Equipo](#equipo)

---

## Arquitectura del sistema {#arquitectura}

El sistema está compuesto por tres capas principales que se comunican entre sí:

```
Estudiante (App React / React Native)
              │
              ▼
   [n8n — Webhook /agente]
              │
              ▼
      [Workflow 3 — AI Agent]
              │
     ┌────────┼────────┐
     ▼        ▼        ▼
  Tool 1   Tool 2   Tool 3
  [RAG]    [BD]   [Sheets]
     │        │        │
     ▼        ▼        ▼
[WF1]      [WF2]   [Google Sheets]
[/chatbot] [/consulta] Calendario CCD
     │        │
     ▼        ▼ (Enrutado por if)
[FastAPI — JupyterHub — localhost:8765]
     │        │
     ▼        ▼
[NVIDIA API] [PostgreSQL cosmos]
[Llama 3.1]  [ccd_reader]
     ▲
     │
[Workflow 4 — Schedule 6AM]
[Actualiza embeddings automáticamente]
```

### Tecnologías utilizadas

| Componente | Tecnología |
|-----------|-----------|
| Servidor | Azure — Ubuntu |
| Orquestador | n8n (Docker) — Puerto 5678 |
| API RAG | FastAPI + Uvicorn — Puerto 8765 |
| Base de datos | PostgreSQL — BD `cosmos` |
| Embeddings | NVIDIA API — `nvidia/nv-embedqa-e5-v5` |
| LLM RAG | NVIDIA API — `meta/llama-3.1-8b-instruct` |
| LLM Agente | OpenAI |
| Memoria | PostgreSQL Chat Memory |
| Calendario | Google Sheets API |
| App móvil | React Native + Expo SDK 54 |



## Requisitos previos {#requisitos}

### Para el backend (JupyterHub + n8n)
- Acceso a JupyterHub 
- Acceso a n8n 
- API Key de NVIDIA 
- Cuenta de Google con acceso a Google Sheets

### Para la app móvil
- Node.js instalado en el PC
- Expo Go instalado en el celular (Play Store / App Store)
- PC y celular en la misma red WiFi



## Componente 1 — JupyterHub (API RAG) {#jupyterhub}

### ¿Qué hace?
JupyterHub actúa como servidor de la API REST que expone los endpoints de RAG y base de datos. Está compuesto por dos notebooks:

| Notebook | Función |
|----------|---------|
| `RAG_CCD.ipynb` | Genera y actualiza los embeddings del documento CCD |
| `RAG_API.ipynb` | Expone la API FastAPI con todos los endpoints |


### Paso 1 — Preparar los archivos de conocimiento

Subir a JupyterHub los siguientes archivos en la misma carpeta que los notebooks:

- `ccd.txt` — Información institucional fija del CCD (pilares, cursos, insignia, modalidades)
- `news.txt` — Noticias y convocatorias del CCD (se actualiza periódicamente)

<img width="291" height="514" alt="image" src="https://github.com/user-attachments/assets/20fb277e-ef10-4948-8936-0d3cd1221b58" />



### Paso 2 — Ejecutar RAG_CCD.ipynb (generar embeddings)

Abrir `RAG_CCD.ipynb` y ejecutar todas las celdas en orden:

**Celda 1 — Instalar dependencias:**
```python
!pip install pymupdf psycopg2-binary langchain-text-splitters requests --target ./libs
```

**Celda 2 — Cargar documentos:**
```python
import os

archivo_teoria = "ccd.txt"
archivo_noticias = "news.txt"
texto_completo = ""

if os.path.exists(archivo_teoria):
    with open(archivo_teoria, "r", encoding="utf-8") as f:
        texto_completo += f.read() + "\n\n"
    print(f"📖 {archivo_teoria} cargado exitosamente.")

if os.path.exists(archivo_noticias):
    with open(archivo_noticias, "r", encoding="utf-8") as f:
        texto_completo += f.read() + "\n\n"
    print(f"📰 {archivo_noticias} cargado exitosamente.")

print(f"\n✅ Base de conocimiento unificada: {len(texto_completo)} caracteres.")
```

**Celda 3 — Dividir en fragmentos:**
```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=900,
    chunk_overlap=200,
    separators=["\n\n", "\n", " ", ""]
)
chunks = splitter.split_text(texto_completo)
print(f"✅ Texto dividido en {len(chunks)} fragmentos.")
```

**Celda 4 — Generar embeddings con NVIDIA:**
```python
import requests, time, json

NVIDIA_API_KEY = "nvapi-TU_API_KEY_AQUI"

def get_embedding(texto):
    response = requests.post(
        "https://integrate.api.nvidia.com/v1/embeddings",
        headers={
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "input": texto,
            "model": "nvidia/nv-embedqa-e5-v5",
            "input_type": "passage",
            "encoding_format": "float"
        }
    )
    return response.json()["data"][0]["embedding"]

datos = []
for i, chunk in enumerate(chunks):
    embedding = get_embedding(chunk)
    datos.append({"contenido": chunk, "embedding": embedding})
    time.sleep(0.3)
    print(f"  Fragmento {i+1}/{len(chunks)} ✅")

with open("ccd_embeddings.json", "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False)

print(f"\n✅ {len(datos)} fragmentos guardados en ccd_embeddings.json")
```

**Resultado esperado:**

<img width="457" height="430" alt="image" src="https://github.com/user-attachments/assets/3d0125fd-35b5-4af2-8e5f-68af3c2a7596" />


### Paso 3 — Ejecutar RAG_API.ipynb (levantar la API)

Abrir `RAG_API.ipynb` y ejecutar todas las celdas en orden:

**Celda 1 — Instalar dependencias:**
```python
!pip install fastapi uvicorn psycopg2-binary langchain-text-splitters --target ./libs
```

**Celda 2 — Cargar embeddings y definir búsqueda:**
```import json, numpy as np, requests as req

NVIDIA_API_KEY = "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"

try:
    with open("ccd_embeddings.json", "r", encoding="utf-8") as f:
        datos = json.load(f)
    print(f"✅ Inicialización: {len(datos)} fragmentos cargados en memoria.")
except Exception as e:
    datos = []
    print("⚠️ No se encontró ccd_embeddings.json inicial. Corre el endpoint /scraping para generarlo.")

def get_embedding(texto):
    r = req.post(
        "https://integrate.api.nvidia.com/v1/embeddings",
        headers={"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"},
        json={"input": texto, "model": "nvidia/nv-embedqa-e5-v5",
              "input_type": "query", "encoding_format": "float"}
    )
    return r.json()["data"][0]["embedding"]

def buscar_contexto(pregunta, top_k=5):
    if not datos: return "No hay contexto disponible."
    emb_p = np.array(get_embedding(pregunta))
    scores = []
    for item in datos:
        emb = np.array(item["embedding"])
        sim = np.dot(emb, emb_p) / (np.linalg.norm(emb) * np.linalg.norm(emb_p))
        scores.append((sim, item["contenido"]))
    scores.sort(reverse=True)
    return "\n\n".join([t for _, t in scores[:top_k]])

def preguntar_chatbot(pregunta):
    contexto = buscar_contexto(pregunta)
    r = req.post(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "meta/llama-3.1-8b-instruct",
            "messages": [
                {
                    "role": "system", 
                    "content": (
                        "Eres el asistente virtual oficial del Centro de Competencias Digitales (CCD) de la UNAB. "
                        "Tu misión es responder las dudas del estudiante de forma CLARA, CONCISA Y DIRECTA. "
                        "REGLA DE ORO: Utiliza exclusivamente el contexto proporcionado. "
                        "Sé muy breve: evita introducciones largas, saludos repetitivos o conclusiones innecesarias. "
                        "Si el estudiante pide una lista o nombres de cursos, muéstralos en viñetas cortas, directo al grano. "
                        "Si no encuentras la información, di: 'No tengo esa información disponible.' "
                        "Nunca inventes datos. Responde siempre en español de forma amable."
                    )
                },
                {"role": "user", "content": f"Contexto:\n{contexto}\n\nPregunta: {pregunta}"}
            ],
            "max_tokens": 200,       # <- Respuestas cortas aseguradas
            "temperature": 0.1       # <- Máxima precisión
        }
    )
    return r.json()["choices"][0]["message"]["content"]

print("✅ Funciones optimizadas para respuestas cortas cargadas.")
```

**Celda 3 — Lanzar la API:**
```python
import threading
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import json
import os, time

app = FastAPI()

class Pregunta(BaseModel):
    pregunta: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/reload")
def reload_embeddings():
    global datos
    try:
        with open("ccd_embeddings.json", "r", encoding="utf-8") as f:
            datos = json.load(f)
        return {"status": "success", "mensaje": f"Se cargaron exitosamente {len(datos)} fragmentos actualizados con noticias."}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/scraping")
def actualizar_noticias():
    try:
        # 1. Leer archivos locales
        texto = ""
        for archivo in ["ccd.txt", "news.txt"]:
            if os.path.exists(archivo):
                with open(archivo, "r", encoding="utf-8") as f:
                    texto += f.read() + "\n\n"
                print(f"📖 {archivo} cargado exitosamente.")
            else:
                print(f"⚠️ {archivo} no encontrado.")
                
        if not texto:
            return {"status": "error", "mensaje": "No se encontraron archivos de texto para procesar."}
            
        # 2. Dividir en fragmentos (Punto dulce para evitar el error 400 de NVIDIA)
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=900,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
        chunks = splitter.split_text(texto)
        print(f"📝 Se generaron {len(chunks)} fragmentos seguros.")
            
        # 3. Generar embeddings llamando a NVIDIA uno por uno
        nuevos_datos = []
        for i, chunk in enumerate(chunks):
            embedding = get_embedding(chunk)
            nuevos_datos.append({
                "contenido": chunk,
                "embedding": embedding
            })
            time.sleep(0.3) # Evita bloqueos de Rate Limit
            
        # 4. Guardar la nueva base de conocimiento en el disco
        with open("ccd_embeddings.json", "w", encoding="utf-8") as f:
            json.dump(nuevos_datos, f, ensure_ascii=False)
            
        # 5. Actualizar la memoria RAM de la API inmediatamente
        global datos
        datos = nuevos_datos
            
        return {
            "status": "success",
            "fragmentos": len(nuevos_datos),
            "mensaje": f"Base de conocimiento actualizada en caliente con {len(nuevos_datos)} fragmentos."
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/chat")
def chat(body: Pregunta):
    try:
        respuesta = preguntar_chatbot(body.pregunta)
        return {"respuesta": respuesta}
    except Exception as e:
        return {"error": str(e)}

def run():
    uvicorn.run(app, host="0.0.0.0", port=8765)

if 't' not in locals() or not t.is_alive():
    t = threading.Thread(target=run, daemon=True)
    t.start()
    print("✅ API corriendo en http://localhost:8765")
else:
    print("🔄 API reconfigurada en caliente en http://localhost:8765")
```

**Resultado esperado:**
```
✅ API corriendo en http://localhost:8765
```

**Verificar que la API está activa:**
```python
import requests
r = requests.get("http://localhost:8765/health")
print(r.status_code, r.json())
```
<img width="595" height="137" alt="image" src="https://github.com/user-attachments/assets/179e7fa5-8807-4710-92c9-3c4163a27c67" />


### Endpoints disponibles de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Verifica que la API está activa |
| POST | `/chat` | Consulta RAG — responde preguntas generales |
| POST | `/db` | Ejecuta SQL crudo en PostgreSQL |
| POST | `/bd` | Consulta estructurada (progreso/cursos/oferta) |
| POST | `/scraping` | Regenera embeddings con ccd.txt + news.txt |
| POST | `/reload` | Recarga embeddings en memoria RAM |


## Componente 2 — Workflows n8n {#n8n}

Acceder a n8n en: `https://unab-n8n.duckdns.org:5678`

El sistema tiene 4 workflows que trabajan en conjunto:


### Workflow 1 — Consulta RAG (`/chatbot`)

**Función:** Recibe una pregunta y responde usando el sistema RAG con la base de conocimiento del CCD.

**Estructura:**
```
Webhook → HTTP Request → Respond to Webhook
```

**Configuración:**

| Nodo | Parámetro | Valor |
|------|-----------|-------|
| Webhook | Path | `chatbot` |
| Webhook | Method | POST |
| HTTP Request | Method | POST |
| HTTP Request | URL | `http://localhost:8765/chat` |
| HTTP Request | Body | `{"pregunta": "{{ $json.body.pregunta }}"}` |
| Respond to Webhook | Respond With | JSON |
| Respond to Webhook | Body | `{"respuesta": "{{ $json.respuesta }}"}` |

<img width="801" height="271" alt="image" src="https://github.com/user-attachments/assets/87051a7a-705d-4c14-a7ad-0974cce72fc6" />


### Workflow 2 — Consulta Base de Datos (`/consulta`)

**Función:** Recibe consultas estructuradas del estudiante y las procesa a través de la API de JupyterHub.

**Estructura:**
```
Webhook → HTTP Request → Respond to Webhook
```

**Configuración:**

| Nodo | Parámetro | Valor |
| :--- | :--- | :--- |
| **Webhook** | Path | `consulta` |
| **Webhook** | Method | POST |
| **if** | Condition | {{ $json.body.tipo }} is equal to 'proceso' |
| **if** | Default | cursos  |
| **HTTP Request (Rama 0)** | Method | POST |
| **HTTP Request (Rama 0)** | URL | `http://localhost:8765/bd` |
| **HTTP Request (Rama 0)** | Body | `{"tipo": "progreso", "id_estudiante": "{{ $('Webhook').item.json.body.id_estudiante }}"}` |
| **Code (Rama 0)** | Mode | Run Once for Each Item (Procesa y formatea el JSON de progreso) |
| **HTTP Request (Rama 1)** | Method | POST |
| **HTTP Request (Rama 1)** | URL | `http://localhost:8765/bd` |
| **HTTP Request (Rama 1)** | Body | `{"tipo": "cursos", "id_estudiante": "{{ $('Webhook').item.json.body.id_estudiante }}"}` |
| **Code (Rama 1)** | Mode | Run Once for Each Item (Procesa y formatea el JSON de cursos) |
| **Respond to Webhook** | Respond With | JSON |
| **Respond to Webhook** | Body | `{"respuesta": "{{ $json.respuesta }}"}` |

**Tipos de consulta disponibles:**
```json
{ "tipo": "progreso", "id_estudiante": "20220003" }
{ "tipo": "cursos",   "id_estudiante": "20220003" }
```

<img width="1311" height="485" alt="image" src="https://github.com/user-attachments/assets/9b47d8b9-af51-4a56-93e0-6c32abeb8eff" />




### Workflow 3 — AI Agent Principal (`/agente`)

**Función:** Punto de entrada principal. Agente inteligente que decide qué herramientas usar según la pregunta del estudiante, pudiendo combinar RAG, base de datos y calendario en una sola respuesta.

**Estructura:**
```
Webhook → AI Agent → Respond to Webhook
              │
     ┌────────┼──────────┐
     ▼        ▼          ▼
Chat Model  Postgres   Tools x3
(OpenAI)    Memory   [RAG][BD][Sheets]
```

**Configuración del AI Agent:**

*System Message:*
```
Eres el asistente virtual del Centro de Competencias Digitales (CCD) de la UNAB.

Tienes tres herramientas disponibles:
- consultar_rag: para preguntas generales sobre el CCD, cursos, pilares, insignia, modalidades y noticias recientes
- consultar_bd: para consultar datos personales del estudiante como progreso en pilares, materias aprobadas, historial de cursos y oferta vigente
- consultar_calendario: para consultar fechas importantes del CCD como inscripciones, inicio de cursos, pruebas diagnósticas, talleres y eventos

Si la pregunta mezcla varias fuentes, usa TODAS las herramientas necesarias y combina la respuesta.
El ID del estudiante es: {{ $('Webhook').item.json.body.id_estudiante }}
Responde siempre en español, claro y amable. Nunca inventes información.Ademas solo responde la pregunta brevemente, solo di informacion adicional si lo piden.
```

*User Message:*
```
{{ $('Webhook').item.json.body.mensaje }}
```

**Configuración de herramientas:**

| Tool | Tipo | URL | Descripción |
|------|------|-----|-------------|
| `consultar_rag` | HTTP Request | `https://unab-n8n.duckdns.org:5678/webhook/chatbot` | Información general del CCD y noticias |
| `consultar_bd` | HTTP Request | `https://unab-n8n.duckdns.org:5678/webhook/consulta` | Datos personales del estudiante |
| `consultar_calendario` | Google Sheets | ID: `1t08MeYFWzU6qpNDx3yF81Hu8G4tlGu_fjyn8yJaXmSg` | Fechas y eventos del CCD |

**Configuración Postgres Chat Memory:**
- Session ID: `{{ $('Webhook').item.json.body.id_estudiante }}`
- Context Window: 10 mensajes

<img width="1062" height="501" alt="image" src="https://github.com/user-attachments/assets/6b961bde-e3a1-46af-865b-5b7026c82622" />



### Workflow 4 — Actualización Automática (Schedule 6AM)

**Función:** Ejecuta automáticamente cada día a las 6:00 AM para regenerar los embeddings con información fresca de `ccd.txt` y `news.txt`.

**Estructura:**
```
Schedule Trigger → HTTP Request (/scraping) → IF → HTTP Request (/reload)
                                               └──→ Code (log error)
```

**Configuración:**

| Nodo | Parámetro | Valor |
|------|-----------|-------|
| Schedule Trigger | Interval | Every Day |
| Schedule Trigger | Hour | 6 |
| HTTP Request | URL | `http://localhost:8765/scraping` |
| HTTP Request | Method | POST |
| IF | Condition | `{{ $json.status }}` equals `success` |
| HTTP Request (reload) | URL | `http://localhost:8765/reload` |
| HTTP Request (reload) | Method | POST |

<img width="920" height="420" alt="image" src="https://github.com/user-attachments/assets/b7342998-f6ac-42e6-8524-2546f2f53a10" />


### Google Sheets — Calendario CCD

El calendario académico está almacenado en Google Sheets y es consultado directamente por el AI Agent.

**Configuración:**
- **ID del documento:** `1t08MeYFWzU6qpNDx3yF81Hu8G4tlGu_fjyn8yJaXmSg`
- **Credencial:** Google Sheets OAuth2
- **Columnas:** `evento`, `fecha`, `tipo`, `descripcion`

<img width="1209" height="610" alt="image" src="https://github.com/user-attachments/assets/473b5492-860b-4eb3-8ff6-a0a875db64b1" />


## Componente 3 — App React Native {#app}

### Estructura del proyecto

```
CCD-UNAB/
├── App.js
├── src/
│   ├── constants/colors.js
│   ├── context/AppContext.js
│   ├── services/chatService.js
│   ├── navigation/AppNavigator.js
│   └── screens/
│       ├── LoginScreen.js
│       ├── ChatScreen.js
│       ├── ProgresoScreen.js
│       ├── CalendarioScreen.js
│       └── OfertaScreen.js
```

### Instalación

```bash
# 1. Entrar a la carpeta del proyecto
cd CCD-UNAB

# 2. Instalar dependencias
npm install

# 3. Instalar dependencias de Expo
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage react-native-markdown-display
```

### Configuración del backend

En `src/services/chatService.js` verificar que la URL apunte correctamente:

```javascript
const BASE_URL = 'https://unab-n8n.duckdns.org:5678/webhook';
```

### Pantallas de la app

| Pantalla | Función |
|----------|---------|
| Login | Identificación con código estudiantil de 8 dígitos |
| Chat | Conversación con el agente inteligente |
| Mi Progreso | Estado de los 3 pilares del estudiante |
| Calendario | Eventos y fechas importantes del CCD |
| Oferta | Cursos disponibles para inscripción |



### Ejecución

```bash
# Correr la app
npx expo start

# Si hay problemas de red, usar tunnel
npx expo start --tunnel
```

Escanear el QR con **Expo Go** desde el celular.

<img width="350" height="600" alt="image" src="https://github.com/user-attachments/assets/da617059-b8f2-4abf-8023-4616298edfd6" />


## Cómo ejecutar el sistema completo {#ejecucion}

Seguir estos pasos **en orden** cada vez que se quiera usar el sistema:

### Paso 1 — Levantar la API en JupyterHub
```
1. Abrir JupyterHub en el navegador
2. Abrir RAG_API.ipynb
3. Ejecutar TODAS las celdas en orden (Kernel → Restart & Run All)
4. Esperar el mensaje: ✅ API corriendo en http://localhost:8765
5. Verificar: GET http://localhost:8765/health → {"status": "ok"}
```

### Paso 2 — Verificar workflows en n8n
```
1. Abrir n8n en https://unab-n8n.duckdns.org:5678
2. Confirmar que los 4 workflows estén ACTIVOS (toggle verde/azul):
   ✅ Workflow 1: /webhook/chatbot
   ✅ Workflow 2: /webhook/consulta
   ✅ Workflow 3: /webhook/agente
   ✅ Workflow 4: Schedule activo
```

### Paso 3 — Correr la app móvil
```bash
cd CCD-UNAB
npx expo start
# Escanear QR con Expo Go
```

### Paso 4 — Verificar conexión
Desde Jupyter ejecutar:
```python
import requests
r = requests.post(
    "https://unab-n8n.duckdns.org:5678/webhook/agente",
    json={"mensaje": "¿Qué es el CCD?", "id_estudiante": "20220003"}
)
print(r.status_code, r.text)
# Esperado: 200 {"respuesta": "..."}
```

## Estructura de la base de datos {#base-de-datos}

Base de datos: `cosmos` — PostgreSQL — Solo lectura (`ccd_reader`)

```
estudiante (id_estudiante PK)
    │
    ├──▶ cursos_estudiantes (id_estudiante FK)
    │         └── codigo_materia ──▶ catalogo_materias_ccd
    │
    └──▶ registro_nota (id_estudiante FK)
              └── codigo_materia ──▶ catalogo_materias_ccd

oferta — tabla independiente con cupos disponibles
```

| Tabla | Descripción |
|-------|-------------|
| `estudiante` | Datos del estudiante: nombre, programa, facultad, semestre |
| `registro_nota` | Notas por materia (A=Aprobado, R=Reprobado) |
| `catalogo_materias_ccd` | Catálogo de materias por pilar y plan |
| `cursos_estudiantes` | Historial de matrículas con semestre y año |
| `oferta` | Cursos disponibles con cupos, fechas y modalidad |


## Equipo
| Rol | Responsabilidad |
|-----|----------------|
| Backend / IA | JupyterHub, RAG, embeddings, API FastAPI, workflows n8n |
| Frontend | App React Native, navegación, UI/UX |


## Observaciones

- **La API no es persistente:** Si el kernel de JupyterHub se reinicia, hay que volver a ejecutar `RAG_API.ipynb` desde el inicio.
- **Base de datos de solo lectura:** El usuario `ccd_reader` no puede modificar datos — solo consultar.
- **El agente puede tardar:** Las respuestas del AI Agent pueden tomar entre 3 y 15 segundos dependiendo de las herramientas que use.
- **Memoria por estudiante:** El agente recuerda las últimas 10 interacciones de cada estudiante usando su código como identificador de sesión.
- **Scraping sintético:** El archivo `news.txt` simula noticias reales del CCD y se actualiza manualmente o mediante el Workflow 4.
