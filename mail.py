from dotenv import load_dotenv
from mailersend import emails
import os
import json

load_dotenv()
api_key = os.getenv("MAILERSEND_API_KEY")

mailer = emails.NewEmail(api_key)

def load_emails_from_json(file_path):
    try:
        with open(file_path, 'r') as file:
            recipients = json.load(file)
            return recipients
    except Exception as e:
        print(f"An error occurred while loading emails: {e}")
        return []

def send_ticket_email(emails_path, message):
    if message is None:
        print("No message to send.")
        return
    
    mail_body = {}

    # Mail From
    mail_from = {
        "name": "Shubham",
        "email": "shubham@trial-3vz9dlep90p4kj50.mlsender.net",
    }

    # Recipients
    recipients = load_emails_from_json(emails_path)
    if not recipients:
        print("No recipients found.")
        return

    # Reply-To
    reply_to = [
        {
            "name": "Shubham",
            "email": "shubham@trial-3vz9dlep90p4kj50.mlsender.net",
        }
    ]

    # Set Mailersend details
    mailer.set_mail_from(mail_from, mail_body)
    mailer.set_mail_to(recipients, mail_body)
    mailer.set_subject("This is a Test Email", mail_body)
    mailer.set_html_content(
        f"<p>{message}</p>", mail_body
    )
    mailer.set_plaintext_content(
        f"{message}", mail_body
    )
    mailer.set_reply_to(reply_to, mail_body)

    # Send the email
    response = mailer.send(mail_body)
    
    print(response)  # For debugging purposes

send_ticket_email("emails.json", "This is a test email message.")