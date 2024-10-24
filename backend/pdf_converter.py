import pdfplumber
import json
from pathlib import Path
from typing import Dict, List, Union, Optional
import re
from dataclasses import dataclass, asdict
from collections import defaultdict
import pytesseract
from PIL import Image
import io
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class PDFElement:
    """Data class to store PDF element information"""
    type: str
    text: str
    page: int
    bbox: Optional[tuple] = None
    confidence: float = 1.0

class PDFToJSON:
    def __init__(self, ocr_enabled: bool = True):
        """
        Initialize PDF to JSON converter
        
        Args:
            ocr_enabled: Whether to use OCR for scanned documents
        """
        self.ocr_enabled = ocr_enabled
        self.structure_patterns = {
            'header': r'^[A-Z\s]{4,}$',
            'date': r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',
            'email': r'[\w\.-]+@[\w\.-]+\.\w+',
            'phone': r'\+?[\d\-\(\)\s]{10,}',
            'amount': r'\$\s*\d+(?:,\d{3})*(?:\.\d{2})?',
            'list_item': r'^\s*[\u2022\-\*]\s',
        }

    def extract_text_with_formatting(self, pdf_path: Union[str, Path]) -> List[PDFElement]:
        """Extract text while preserving formatting and structure"""
        elements = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    # Extract text elements
                    text_elements = page.extract_words(
                        keep_blank_chars=True,
                        x_tolerance=3,
                        y_tolerance=3
                    )
                    
                    # Process each text element
                    for elem in text_elements:
                        text = elem['text'].strip()
                        if not text:
                            continue
                            
                        # Determine element type based on patterns
                        elem_type = self._determine_element_type(text)
                        
                        elements.append(PDFElement(
                            type=elem_type,
                            text=text,
                            page=page_num,
                            bbox=(elem['x0'], elem['top'], elem['x1'], elem['bottom'])
                        ))
                    
                    # Handle forms if present
                    form = page.find_tables()
                    if form:
                        for table in form:
                            elements.extend(self._process_form_elements(table, page_num))
                            
                    # Process images if OCR is enabled
                    if self.ocr_enabled:
                        images = self._extract_images(page)
                        if images:
                            elements.extend(self._process_images(images, page_num))
                            
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            raise
            
        return elements

    def _determine_element_type(self, text: str) -> str:
        """Determine the type of text element based on patterns"""
        for elem_type, pattern in self.structure_patterns.items():
            if re.match(pattern, text):
                return elem_type
        
        # Check for potential form fields
        if ':' in text:
            return 'form_field'
        
        return 'text'

    def _process_form_elements(self, table, page_num: int) -> List[PDFElement]:
        """Process form elements from tables"""
        elements = []
        
        for row in table.extract():
            for cell in row:
                if cell and str(cell).strip():
                    elements.append(PDFElement(
                        type='form_field',
                        text=str(cell).strip(),
                        page=page_num
                    ))
                    
        return elements

    def _extract_images(self, page) -> List[Image.Image]:
        """Extract images from PDF page"""
        images = []
        if hasattr(page, 'images'):
            for img in page.images:
                try:
                    image = Image.open(io.BytesIO(img['stream'].get_data()))
                    images.append(image)
                except Exception as e:
                    logger.warning(f"Could not process image: {e}")
        return images

    def _process_images(self, images: List[Image.Image], page_num: int) -> List[PDFElement]:
        """Process images with OCR"""
        elements = []
        
        for img in images:
            try:
                # Perform OCR
                ocr_result = pytesseract.image_to_data(
                    img, 
                    output_type=pytesseract.Output.DICT
                )
                
                # Process OCR results
                for i, text in enumerate(ocr_result['text']):
                    if text.strip():
                        confidence = float(ocr_result['conf'][i]) / 100
                        if confidence > 0.5:  # Filter low-confidence results
                            elements.append(PDFElement(
                                type='ocr_text',
                                text=text.strip(),
                                page=page_num,
                                confidence=confidence
                            ))
                            
            except Exception as e:
                logger.warning(f"OCR processing failed: {e}")
                
        return elements

    def _group_elements(self, elements: List[PDFElement]) -> Dict:
        """Group elements by type and structure"""
        grouped = defaultdict(list)
        
        # Group by page and type
        for element in elements:
            grouped[f"page_{element.page}"].append(asdict(element))
            grouped[f"type_{element.type}"].append(asdict(element))
            
        # Extract metadata
        grouped['metadata'] = {
            'total_pages': max(element.page for element in elements),
            'element_types': list(set(element.type for element in elements)),
            'processing_date': datetime.now().isoformat(),
            'ocr_enabled': self.ocr_enabled
        }
        
        return dict(grouped)

    def convert_to_json(self, pdf_path: Union[str, Path], output_path: Optional[Union[str, Path]] = None) -> Dict:
        """
        Convert PDF to structured JSON
        
        Args:
            pdf_path: Path to PDF file
            output_path: Optional path to save JSON output
            
        Returns:
            Dictionary containing structured PDF content
        """
        # Extract elements
        elements = self.extract_text_with_formatting(pdf_path)
        
        # Group elements
        structured_data = self._group_elements(elements)
        
        # Save to file if output path provided
        if output_path:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(structured_data, f, indent=2, ensure_ascii=False)
                
            logger.info(f"JSON output saved to: {output_path}")
        
        return structured_data

def main():
    # Example usage
    converter = PDFToJSON(ocr_enabled=True)
    
    # Process single PDF
    try:
        result = converter.convert_to_json(
            pdf_path='21i-0893.Shahzeb Umer.Assignment1.pdf',
            output_path='output.json'
        )
        print(f"Successfully processed PDF with {result['metadata']['total_pages']} pages")
        
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        
    # Process multiple PDFs in directory
    pdf_dir = Path('pdfs')
    output_dir = Path('json_output')
    
    if pdf_dir.exists():
        for pdf_file in pdf_dir.glob('*.pdf'):
            try:
                output_path = output_dir / f"{pdf_file.stem}.json"
                converter.convert_to_json(pdf_file, output_path)
                logger.info(f"Processed: {pdf_file.name}")
                
            except Exception as e:
                logger.error(f"Failed to process {pdf_file.name}: {e}")

if __name__ == "__main__":
    main()