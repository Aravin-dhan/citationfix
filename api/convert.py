from http.server import BaseHTTPRequestHandler
import json
import io
from docx import Document
import re

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            text = data.get('text', '')

            # Validate input
            if not text:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No text provided'}).encode())
                return

            # Word count validation
            word_count = len(text.split())
            if word_count > 10000:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Text exceeds 10,000 word limit (current: {word_count})'}).encode())
                return

            # Process text and generate docx
            doc = Document()
            
            # Split text by newlines to preserve paragraphs
            paragraphs = text.split('\n')
            
            for para_text in paragraphs:
                if not para_text.strip():
                    continue
                    
                p = doc.add_paragraph()
                
                # Regex to find {{fn: ...}} markers
                parts = re.split(r'(\{\{fn:.*?\}\})', para_text)
                
                for part in parts:
                    if part.startswith('{{fn:') and part.endswith('}}'):
                        # Extract citation text
                        citation = part[5:-2].strip()
                        if citation:
                            # Add footnote using python-docx-2023 method
                            # This appends a footnote reference to the paragraph
                            p.add_footnote(citation)
                    else:
                        # Regular text
                        if part:
                            p.add_run(part)

            # Save to buffer
            buffer = io.BytesIO()
            doc.save(buffer)
            buffer.seek(0)
            docx_content = buffer.getvalue()

            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            self.send_header('Content-Disposition', 'attachment; filename="CitationFix-Output.docx"')
            self.end_headers()
            self.wfile.write(docx_content)

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_msg = str(e)
            self.wfile.write(json.dumps({'error': 'Internal server error', 'details': error_msg}).encode())

    def do_GET(self):
        self.send_response(405)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'error': 'Method not allowed'}).encode())
