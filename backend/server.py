from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from typing import List, Optional
import os
import uuid
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(title="Jasa Tukang Hemat API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.jasa_tukang_hemat
tukang_collection = db.tukang

# Pydantic models
class TukangCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    skills: str = Field(..., regex="^(Listrik|Cat|Bangunan|Servis AC|Lainnya)$")
    city: str = Field(..., min_length=1, max_length=50)
    whatsapp_number: str = Field(..., min_length=10, max_length=15)

class Tukang(BaseModel):
    id: str
    name: str
    skills: str
    city: str
    whatsapp_number: str
    created_at: str

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Jasa Tukang Hemat API"}

@app.post("/api/tukang", response_model=dict)
async def create_tukang(tukang_data: TukangCreate):
    try:
        # Generate UUID for tukang
        tukang_id = str(uuid.uuid4())
        
        # Format WhatsApp number (ensure it starts with +62)
        whatsapp = tukang_data.whatsapp_number.strip()
        if whatsapp.startswith('0'):
            whatsapp = '+62' + whatsapp[1:]
        elif not whatsapp.startswith('+62'):
            whatsapp = '+62' + whatsapp
            
        # Create tukang document
        tukang_doc = {
            "id": tukang_id,
            "name": tukang_data.name.strip(),
            "skills": tukang_data.skills,
            "city": tukang_data.city.strip(),
            "whatsapp_number": whatsapp,
            "created_at": datetime.now().isoformat()
        }
        
        # Insert into database
        result = tukang_collection.insert_one(tukang_doc)
        
        if result.inserted_id:
            return {"success": True, "message": "Tukang berhasil didaftarkan", "id": tukang_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to create tukang")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/tukang", response_model=List[Tukang])
async def get_all_tukang():
    try:
        # Fetch all tukang from database
        tukang_list = list(tukang_collection.find({}, {"_id": 0}))
        
        # Sort by created_at (newest first)
        tukang_list.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return tukang_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tukang/{tukang_id}", response_model=Tukang)
async def get_tukang_by_id(tukang_id: str):
    try:
        tukang = tukang_collection.find_one({"id": tukang_id}, {"_id": 0})
        
        if not tukang:
            raise HTTPException(status_code=404, detail="Tukang not found")
            
        return tukang
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tukang/{tukang_id}")
async def delete_tukang(tukang_id: str):
    try:
        result = tukang_collection.delete_one({"id": tukang_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Tukang not found")
            
        return {"success": True, "message": "Tukang berhasil dihapus"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)