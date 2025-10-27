from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import os
import json
from datetime import datetime
import redis
import mysql.connector
from dotenv import load_dotenv
import zipfile
from io import BytesIO

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuración
DOWNLOAD_FOLDER = '../../downloads'
CHATS_FOLDER = '../../chats'

# Crear directorios si no existen
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
os.makedirs(CHATS_FOLDER, exist_ok=True)

# Conexión Redis
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    decode_responses=True
)

# Conexión MySQL
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'whatsapp_masivo')
    )

# Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'service': 'Python Microservice'}), 200

# Exportar contactos a Excel
@app.route('/export/contacts', methods=['POST'])
def export_contacts():
    try:
        data = request.json
        categoria_id = data.get('categoria_id')
        usuario_id = data.get('usuario_id')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = '''
            SELECT c.id, c.nombre, c.telefono, c.estado, 
                   cat.nombre as categoria, c.fecha_agregado
            FROM contactos c
            LEFT JOIN categorias cat ON c.categoria_id = cat.id
            WHERE c.usuario_id = %s
        '''
        params = [usuario_id]

        if categoria_id:
            query += ' AND c.categoria_id = %s'
            params.append(categoria_id)

        cursor.execute(query, params)
        contacts = cursor.fetchall()

        cursor.close()
        conn.close()

        # Crear DataFrame
        df = pd.DataFrame(contacts)
        
        # Generar archivo Excel
        filename = f'contactos_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        filepath = os.path.join(DOWNLOAD_FOLDER, filename)
        
        df.to_excel(filepath, index=False, engine='openpyxl')

        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'total': len(contacts)
        }), 200

    except Exception as e:
        return jsonify({
            'error': True,
            'message': str(e)
        }), 500

# Exportar chat individual
@app.route('/export/chat', methods=['POST'])
def export_chat():
    try:
        data = request.json
        chat_data = data.get('messages', [])
        contact_name = data.get('contact_name', 'chat')
        contact_phone = data.get('contact_phone', 'unknown')

        if not chat_data:
            return jsonify({
                'error': True,
                'message': 'No hay mensajes para exportar'
            }), 400

        # Crear carpeta para el contacto
        contact_folder_name = f"{contact_name.replace(' ', '_')}_{contact_phone}"
        contact_folder_path = os.path.join(CHATS_FOLDER, contact_folder_name)
        os.makedirs(contact_folder_path, exist_ok=True)

        # Generar archivo Excel para hoy
        today = datetime.now().strftime("%d-%m-%Y")
        filename = f"{contact_name.replace(' ', '_')}_{contact_phone}_{today}.xlsx"
        filepath = os.path.join(contact_folder_path, filename)

        # Si el archivo existe, cargar y agregar
        if os.path.exists(filepath):
            existing_df = pd.read_excel(filepath)
            new_df = pd.DataFrame(chat_data)
            df = pd.concat([existing_df, new_df], ignore_index=True)
        else:
            df = pd.DataFrame(chat_data)

        # Guardar Excel
        df.to_excel(filepath, index=False, engine='openpyxl')

        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'folder': contact_folder_path,
            'messages_saved': len(chat_data)
        }), 200

    except Exception as e:
        return jsonify({
            'error': True,
            'message': str(e)
        }), 500

# Exportar todos los chats de una categoría
@app.route('/export/category-chats', methods=['POST'])
def export_category_chats():
    try:
        data = request.json
        categoria_id = data.get('categoria_id')
        usuario_id = data.get('usuario_id')
        chats_data = data.get('chats', [])

        if not chats_data:
            return jsonify({
                'error': True,
                'message': 'No hay chats para exportar'
            }), 400

        exported_files = []

        for chat in chats_data:
            contact_name = chat.get('contact_name', 'unknown')
            contact_phone = chat.get('contact_phone', 'unknown')
            messages = chat.get('messages', [])

            if not messages:
                continue

            # Crear carpeta para el contacto
            contact_folder_name = f"{contact_name.replace(' ', '_')}_{contact_phone}"
            contact_folder_path = os.path.join(CHATS_FOLDER, contact_folder_name)
            os.makedirs(contact_folder_path, exist_ok=True)

            # Generar archivo Excel
            today = datetime.now().strftime("%d-%m-%Y")
            filename = f"{contact_name.replace(' ', '_')}_{contact_phone}_{today}.xlsx"
            filepath = os.path.join(contact_folder_path, filename)

            # Si existe, agregar
            if os.path.exists(filepath):
                existing_df = pd.read_excel(filepath)
                new_df = pd.DataFrame(messages)
                df = pd.concat([existing_df, new_df], ignore_index=True)
            else:
                df = pd.DataFrame(messages)

            df.to_excel(filepath, index=False, engine='openpyxl')
            exported_files.append(filename)

        return jsonify({
            'success': True,
            'total_chats': len(exported_files),
            'files': exported_files
        }), 200

    except Exception as e:
        return jsonify({
            'error': True,
            'message': str(e)
        }), 500

# Descargar archivo
@app.route('/download/<path:filename>', methods=['GET'])
def download_file(filename):
    try:
        filepath = os.path.join(DOWNLOAD_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({
                'error': True,
                'message': 'Archivo no encontrado'
            }), 404

        return send_file(filepath, as_attachment=True)

    except Exception as e:
        return jsonify({
            'error': True,
            'message': str(e)
        }), 500

# Obtener estadísticas de archivos
@app.route('/stats/files', methods=['GET'])
def file_stats():
    try:
        # Contar archivos en downloads
        downloads_count = len([f for f in os.listdir(DOWNLOAD_FOLDER) if os.path.isfile(os.path.join(DOWNLOAD_FOLDER, f))])
        
        # Contar carpetas de chats
        chats_count = len([d for d in os.listdir(CHATS_FOLDER) if os.path.isdir(os.path.join(CHATS_FOLDER, d))])

        return jsonify({
            'success': True,
            'stats': {
                'downloads': downloads_count,
                'chat_folders': chats_count,
                'download_path': DOWNLOAD_FOLDER,
                'chats_path': CHATS_FOLDER
            }
        }), 200

    except Exception as e:
        return jsonify({
            'error': True,
            'message': str(e)
        }), 500

# Limpiar archivos antiguos (opcional)
@app.route('/cleanup', methods=['POST'])
def cleanup_old_files():
    try:
        data = request.json
        days = data.get('days', 30)

        import time
        now = time.time()
        cutoff = now - (days * 86400)

        deleted_count = 0

        # Limpiar downloads
        for filename in os.listdir(DOWNLOAD_FOLDER):
            filepath = os.path.join(DOWNLOAD_FOLDER, filename)
            if os.path.isfile(filepath):
                if os.path.getctime(filepath) < cutoff:
                    os.remove(filepath)
                    deleted_count += 1

        return jsonify({
            'success': True,
            'deleted_files': deleted_count
        }), 200

    except Exception as e:
        return jsonify({
            'error': True,
            'message': str(e)
        }), 500

# Importar contactos desde Excel
@app.route('/import/contacts', methods=['POST'])
def import_contacts():
    try:
        if 'file' not in request.files:
            return jsonify({
                'error': True,
                'message': 'No se proporcionó archivo'
            }), 400

        file = request.files['file']
        
        # Leer Excel
        df = pd.read_excel(file, engine='openpyxl')
        
        # Validar columnas requeridas
        required_cols = ['telefono']
        for col in required_cols:
            if col not in df.columns:
                return jsonify({
                    'error': True,
                    'message': f'Columna requerida "{col}" no encontrada'
                }), 400

        # Convertir a lista de diccionarios
        contacts = df.to_dict('records')

        return jsonify({
            'success': True,
            'contacts': contacts,
            'total': len(contacts)
        }), 200

    except Exception as e:
        return jsonify({
            'error': True,
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print('🐍 Microservicio Python iniciado')
    print('📂 Carpeta de descargas:', DOWNLOAD_FOLDER)
    print('💬 Carpeta de chats:', CHATS_FOLDER)
    app.run(host='0.0.0.0', port=5000, debug=True)

