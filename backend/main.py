from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from pathlib import Path
import logging
from typing import Dict
from pdf_converter import PDFToJSON  # Your existing converter class

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your React app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Initialize PDF converter
pdf_converter = PDFToJSON(ocr_enabled=True)

# Configure maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

@app.post("/api/convert-pdf")
async def convert_pdf(file: UploadFile) -> Dict:
    """
    Convert uploaded PDF file to JSON
    
    Args:
        file: Uploaded PDF file
    
    Returns:
        Dictionary containing structured PDF content
    
    Raises:
        HTTPException: If file is invalid or processing fails
    """
    try:
        # Validate file type
        if not file.content_type == "application/pdf":
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload a PDF file."
            )
            
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            
            # Save uploaded file
            temp_pdf_path = temp_dir_path / "temp.pdf"
            
            # Read file in chunks to handle large files
            file_size = 0
            with open(temp_pdf_path, "wb") as pdf_file:
                while chunk := await file.read(1024 * 1024):  # Read 1MB at a time
                    file_size += len(chunk)
                    if file_size > MAX_FILE_SIZE:
                        raise HTTPException(
                            status_code=400,
                            detail="File size exceeds maximum limit of 10MB"
                        )
                    pdf_file.write(chunk)
            
            # Process PDF
            logger.info(f"Processing PDF: {file.filename}")
            result = pdf_converter.convert_to_json(
                pdf_path=temp_pdf_path,
                output_path=None  # Don't save to disk, return JSON directly
            )
            
            logger.info(f"Successfully processed PDF: {file.filename}")
            return result
            
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Log the full error for debugging
        logger.error(f"Error processing PDF: {str(e)}", exc_info=True)
        
        # Return a generic error to the client
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the PDF. Please try again."
        )
    finally:
        # Clean up
        await file.close()

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Enable auto-reload during development
    )