from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv
import os
import re
import html

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable CORS for all routes

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
SENDGRID_FROM_EMAIL = os.getenv('SENDGRID_FROM_EMAIL')

@app.route('/')
def index():
    return send_from_directory('.', 'schedule.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/send-email', methods=['POST'])
def send_email():
    try:
        # Get form data
        full_name = request.form.get('fullName', '').strip()
        work_email = request.form.get('workEmail', '').strip()
        phone_number = request.form.get('phoneNumber', '').strip()
        company_name = request.form.get('companyName', '').strip()
        service = request.form.get('service', '').strip()
        contact_message = request.form.get('message', '').strip()

        print(f"Received form data: {full_name}, {work_email}, {phone_number}, {company_name}, {service}")

        # Validate required fields
        if not all([full_name, work_email, phone_number, company_name, service]):
            return jsonify({
                'success': False,
                'message': 'All required fields must be filled.'
            }), 400

        # Validate email
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', work_email):
            return jsonify({
                'success': False,
                'message': 'Please enter a valid email address.'
            }), 400

        # Validate phone (10 digits)
        if not re.match(r'^\d{10}$', phone_number):
            return jsonify({
                'success': False,
                'message': 'Please enter a valid 10-digit phone number.'
            }), 400

        # Escape user-supplied values before embedding them in HTML
        safe_full_name = html.escape(full_name)
        safe_work_email = html.escape(work_email)
        safe_phone_number = html.escape(phone_number)
        safe_company_name = html.escape(company_name)
        safe_service = html.escape(service)
        safe_contact_message = html.escape(contact_message) if contact_message else 'No message provided'

        # Create email content
        email_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #0EA5E9; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; background: #f8f9fa; border-radius: 0 0 10px 10px; }}
                .field {{ margin-bottom: 15px; }}
                .label {{ font-weight: bold; color: #0B2545; }}
                .value {{ margin-left: 10px; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>📧 New Contact Form Submission</h2>
                    <p style="margin: 0;">DeltaMax - Contact Form</p>
                </div>
                <div class="content">
                    <div class="field">
                        <span class="label">👤 Full Name:</span>
                        <span class="value">{safe_full_name}</span>
                    </div>
                    <div class="field">
                        <span class="label">📧 Email:</span>
                        <span class="value">{safe_work_email}</span>
                    </div>
                    <div class="field">
                        <span class="label">📱 Phone:</span>
                        <span class="value">{safe_phone_number}</span>
                    </div>
                    <div class="field">
                        <span class="label">🏢 Company:</span>
                        <span class="value">{safe_company_name}</span>
                    </div>
                    <div class="field">
                        <span class="label">🛠️ Service:</span>
                        <span class="value">{safe_service}</span>
                    </div>
                    <div class="field">
                        <span class="label">💬 Message:</span>
                        <span class="value">{safe_contact_message}</span>
                    </div>
                </div>
                <div class="footer">
                    <p>This email was sent from the DeltaMax contact form.</p>
                    <p>© 2026 NeuAlto & KatalystStreet. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        if not SENDGRID_API_KEY:
            return jsonify({
                'success': False,
                'message': 'Email service is not configured on the server.'
            }), 500

        # Create the email
        mail_message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails='bhavana@neualto.com',
            subject='New Contact Form Submission - DeltaMax',
            html_content=email_html
        )

        # Send email using SendGrid
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(mail_message)

        print(f"Email sent successfully! Status: {response.status_code}")

        return jsonify({
            'success': True,
            'message': 'Email sent successfully!',
            'status_code': response.status_code
        }), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    print("📍 Server running at: http://localhost:5000")
    print("📧 Press Ctrl+C to stop")
    app.run(debug=True, host='0.0.0.0', port=5000)