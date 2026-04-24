from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import requests
from bs4 import BeautifulSoup
import re
import time
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-3-flash-preview')

# College website URLs
COLLEGE_URL = os.getenv("COLLEGE_URL", "https://sece.ac.in/")
COLLEGE_SUB_PAGES = [
    "https://sece.ac.in/governance/",
    "https://sece.ac.in/department-computer-science-engineering-2/"
]

# Cache for college data
college_data_cache = None
last_fetch_time = None
CACHE_DURATION = 3600  # 1 hour

def _extract_page_data(soup, page_label):
    """Extract and return cleaned text data from a BeautifulSoup object."""
    data_parts = []

    # Get title
    title = soup.find('title')
    if title:
        data_parts.append(f"[{page_label}] Title: {title.get_text().strip()}")

    # Get headings (h1, h2, h3)
    for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
        text = tag.get_text().strip()
        if text and len(text) > 3:
            data_parts.append(f"[{page_label}] Heading: {text}")

    # Get paragraphs
    for p in soup.find_all('p'):
        text = p.get_text().strip()
        if text and len(text) > 20:
            data_parts.append(f"[{page_label}] {text}")

    # Get list items
    for li in soup.find_all('li'):
        text = li.get_text().strip()
        if text and len(text) > 10:
            data_parts.append(f"[{page_label}] {text}")

    # Get navigation links text
    for nav in soup.find_all('nav'):
        for a in nav.find_all('a'):
            text = a.get_text().strip()
            if text and len(text) > 2:
                data_parts.append(f"[{page_label}] Link: {text}")

    # Get meta descriptions
    for meta in soup.find_all('meta'):
        desc = meta.get('content')
        if desc and len(desc) > 20:
            data_parts.append(f"[{page_label}] {desc}")

    return data_parts

def fetch_college_data():
    """Fetch and parse data from college website and sub-pages"""
    global college_data_cache, last_fetch_time

    # Return cached data if still valid
    if college_data_cache and last_fetch_time:
        if time.time() - last_fetch_time < CACHE_DURATION:
            return college_data_cache

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    all_data_parts = []
    urls_to_fetch = [("Home", COLLEGE_URL)] + [(f"Page {i+1}", url) for i, url in enumerate(COLLEGE_SUB_PAGES)]

    for page_label, url in urls_to_fetch:
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            page_data = _extract_page_data(soup, page_label)
            all_data_parts.extend(page_data)
            print(f"✅ Fetched {page_label}: {len(page_data)} content sections")
        except Exception as e:
            print(f"❌ Error fetching {url}: {e}")

    if not all_data_parts:
        return None

    # Clean and deduplicate data
    cleaned_data = []
    seen = set()
    for part in all_data_parts:
        part = re.sub(r'\s+', ' ', part).strip()
        part = part[:500]  # Limit length

        if part and part not in seen and len(part) > 10:
            seen.add(part)
            cleaned_data.append(part)

    college_data_cache = "\n\n".join(cleaned_data[:150])  # Limit to 150 parts across all pages
    last_fetch_time = time.time()

    print(f"✅ Total fetched college data: {len(cleaned_data)} content sections")
    return college_data_cache

@app.route('/ask', methods=['POST'])
def ask():
    question = request.form.get('question', '')
    
    if not question:
        return jsonify({'error': 'No question provided'}), 400
    
    try:
        # Fetch college data
        college_data = fetch_college_data()
        
        # Create context-aware prompt
        if college_data:
            prompt = f"""You are an AI assistant for Sri Eshwar College of Engineering (SECE). 
Use the following information from the college website to answer questions accurately.

College Website Information:
{college_data}

Question: {question}

Instructions:
- If the question is about the college (admissions, courses, fees, placements, facilities, contact, etc.), use the above information to provide accurate answers.
- If you don't have specific information from the website, say so honestly.
- Keep your answer concise and helpful.
- If the question is not related to the college, politely redirect to college-related topics."""
        else:
            prompt = f"""You are an AI assistant for Sri Eshwar College of Engineering (SECE).
Question: {question}

Provide a helpful response about the college. If you need specific information, direct them to visit https://sece.ac.in/"""
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/refresh-data', methods=['POST'])
def refresh_data():
    """Endpoint to manually refresh college data"""
    global college_data_cache, last_fetch_time
    college_data_cache = None
    last_fetch_time = None
    fetch_college_data()
    return jsonify({'message': 'College data refreshed successfully'})

if __name__ == '__main__':
    print("🚀 Flask server running at http://127.0.0.1:5000")
    print("📚 Fetching college data from SECE website...")
    fetch_college_data()
    app.run(debug=True, port=5000)

