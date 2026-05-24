const BASE_URL = 'https://unab-n8n.duckdns.org:5678/webhook';

export const preguntarAlAgente = async (mensaje, idEstudiante) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${BASE_URL}/agente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje, id_estudiante: idEstudiante }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    // 1. Leemos la respuesta cruda como texto primero
    const textData = await response.text();
    
    // Si la respuesta vino completamente vacía
    if (!textData.trim()) {
      return 'El agente recibió el mensaje pero devolvió una respuesta vacía. Revisa el nodo de respuesta en n8n.';
    }

    try {
      // 2. Intentamos parsear si es un JSON válido
      const jsonData = JSON.parse(textData);
      return jsonData.respuesta || jsonData.output || jsonData.text || 'No se encontró un campo de texto en el JSON.';
    } catch {
      // 3. ¡Si no es un JSON, no pasa nada! Usamos el texto directo que envió n8n
      return textData;
    }

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return 'La solicitud tardó demasiado. Intenta de nuevo.';
    }
    return `Detalle del error: ${error.message}`;
  }
};
export const consultarProgreso = async (idEstudiante) => {
  try {
    const response = await fetch(`${BASE_URL}/consulta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'progreso', id_estudiante: idEstudiante }),
    });
    const data = await response.json();
    return data.respuesta || data.output || '';
  } catch {
    return null;
  }
};

export const consultarOferta = async () => {
  try {
    const response = await fetch(`${BASE_URL}/consulta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'oferta' }),
    });
    const data = await response.json();
    return data.respuesta || data.output || '';
  } catch {
    return null;
  }
};

export const consultarCalendario = async (idEstudiante) => {
  try {
    const response = await fetch(`${BASE_URL}/agente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensaje: 'Muéstrame todos los eventos y fechas importantes del calendario del CCD',
        id_estudiante: idEstudiante,
      }),
    });
    const data = await response.json();
    return data.respuesta || data.output || '';
  } catch {
    return null;
  }
};