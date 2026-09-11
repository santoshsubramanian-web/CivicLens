import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import Literal, Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CivicLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class CivicIssue(BaseModel):
    issue_type: Literal[
        "fallen_power_line", "water_main_break", "pothole", 
        "road_hazard", "streetlight_out", "other"
    ] = Field(description="Category of the public infrastructure issue")
    severity: Literal["CRITICAL", "HIGH", "MODERATE", "LOW"] = Field(
        description="Danger level. Fallen lines or massive leaks are CRITICAL"
    )
    location_description: str = Field(description="Location mentioned or visible in the input")
    needs_immediate_dispatch: bool = Field(description="Whether emergency response is needed")
    recommended_action: str = Field(description="Immediate step for the citizen or city dispatch")
    evidence_summary: str = Field(description="Brief summary of what was found in input")

@app.get("/")
def read_root():
    return {"status": "CivicLens backend is running"}

@app.post("/analyze")
async def analyze_issue(
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    contents = []
    
    if description and description.strip():
        contents.append(description)
        
    if file and file.filename:
        file_bytes = await file.read()
        if len(file_bytes) > 0:
            mime_type = file.content_type or "image/jpeg"
            contents.append(types.Part.from_bytes(data=file_bytes, mime_type=mime_type))
        
    if not contents:
        return {"error": "Please provide either an image or a text description."}

    system_instruction = (
        "You are a 311 civic issue triage system. Analyze the provided input, "
        "classify the issue, assess danger level, and extract structured data."
    )

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=CivicIssue,
        ),
    )

    ticket = CivicIssue.model_validate_json(response.text)
    return ticket.model_dump()