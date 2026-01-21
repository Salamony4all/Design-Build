from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64

app = Flask(__name__)
CORS(app)

# Use absolute path for the conversions folder
BASE_DIR = r"c:\Users\Mohamad60025\Desktop\App\D&B"
CONVERSIONS_DIR = os.path.join(BASE_DIR, 'conversions')
NANO_DIR = os.path.join(CONVERSIONS_DIR, 'nano_panana')

@app.route('/api/save-dxf', methods=['POST'])
def save_dxf():
    try:
        data = request.json
        filename = data.get('filename')
        content_b64 = data.get('content') # Base64 encoded file content
        
        if not filename or not content_b64:
            return jsonify({"error": "Missing filename or content"}), 400
        
        # Ensure name ends with .dxf
        if not filename.lower().endswith('.dxf'):
            filename += '.dxf'
            
        # Decode content
        content = base64.b64decode(content_b64)
        
        # Save to nano_panana folder specifically for AI processed files
        filepath = os.path.join(NANO_DIR, filename)
        
        # Create directories if they don't exist
        os.makedirs(NANO_DIR, exist_ok=True)
        
        with open(filepath, 'wb') as f:
            f.write(content)
            
        print(f"[Bridge] Successfully saved {filename} to {filepath}")
        return jsonify({"success": True, "path": filepath})
    except Exception as e:
        print(f"[Bridge] Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "bridge": "Nano Panana Local Bridge"})

if __name__ == '__main__':
    print("Starting Nano Panana Local Bridge on port 5001...")
    print(f"Target Directory: {NANO_DIR}")
    app.run(port=5001, debug=False)
