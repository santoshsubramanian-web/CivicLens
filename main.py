import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Update model string to gemini-3.6-flash (or gemini-1.5-flash if on older endpoint)
response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents="Hello Gemini! Confirm you are connected for our hackathon project.",
)

print("\n--- GEMINI RESPONSE ---")
print(response.text)
print("------------------------\n")