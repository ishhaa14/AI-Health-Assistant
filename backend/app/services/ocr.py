import os
import fitz  # PyMuPDF
import easyocr
import numpy as np
from PIL import Image
from app.core.logging import logger
from app.core.exceptions import FileProcessingException

class OCRService:
    def __init__(self):
        self._reader = None

    @property
    def reader(self):
        """Lazy loader for EasyOCR reader model to minimize startup memory overhead."""
        if self._reader is None:
            logger.info("Initializing EasyOCR English Reader model (CPU)...")
            model_dir = os.environ.get("EASYOCR_MODULE_PATH", None)
            self._reader = easyocr.Reader(['en'], gpu=False, model_storage_directory=model_dir)
        return self._reader

    def extract_text(self, file_path: str) -> str:
        """
        Orchestrates text extraction depending on file format:
        1. If PDF, tries to extract digital text using PyMuPDF first.
        2. Fallbacks to page rasterization + EasyOCR for scanned PDFs.
        3. Uses EasyOCR directly for JPG/PNG files.
        """
        if not os.path.exists(file_path):
            raise FileProcessingException(f"Target file path '{file_path}' does not exist.")

        file_ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_ext == ".pdf":
                return self._process_pdf(file_path)
            elif file_ext in [".jpg", ".jpeg", ".png"]:
                return self._process_image(file_path)
            else:
                raise FileProcessingException(f"Unsupported file extension: {file_ext}")
        except Exception as e:
            logger.error(f"OCR execution failed: {str(e)}", exc_info=True)
            raise FileProcessingException(f"OCR processing failure: {str(e)}")

    def _process_pdf(self, pdf_path: str) -> str:
        """Processes PDF with direct extraction, falling back to scanned OCR if empty."""
        doc = fitz.open(pdf_path)
        extracted_pages = []
        
        logger.info(f"Analyzing PDF '{pdf_path}' with PyMuPDF. Pages: {len(doc)}")
        
        # 1. Attempt digital text extraction
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            if text.strip():
                extracted_pages.append(text.strip())

        full_digital_text = "\n\n--- Page Break ---\n\n".join(extracted_pages)
        
        # If text is substantial (> 50 chars), return it
        if len(full_digital_text.strip()) > 50:
            logger.info("Successfully extracted text digitally using PyMuPDF.")
            return full_digital_text

        # 2. Scanned PDF fallback: render pages and run OCR
        logger.warning("Digital text extraction returned sparse data. Falling back to EasyOCR scanned PDF conversion...")
        scanned_pages_text = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Render page to image bytes (300 DPI is good for OCR)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_data = pix.tobytes("png")
            
            # Read using EasyOCR
            page_text = self._ocr_image_bytes(img_data)
            scanned_pages_text.append(f"[Page {page_num + 1} OCR]\n{page_text}")
            
        return "\n\n--- Page Break ---\n\n".join(scanned_pages_text)

    def _process_image(self, image_path: str) -> str:
        """Extracts text directly from JPG/PNG image files using EasyOCR."""
        logger.info(f"Performing OCR on image '{image_path}' using EasyOCR...")
        # EasyOCR reader accepts filepath directly
        results = self.reader.readtext(image_path, detail=0)
        return "\n".join(results)

    def _ocr_image_bytes(self, img_bytes: bytes) -> str:
        """Processes raw image bytes through EasyOCR reader."""
        # Convert image bytes to a numpy array for OpenCV/EasyOCR
        img = Image.open(fitz.io.BytesIO(img_bytes)).convert("RGB")
        img_np = np.array(img)
        results = self.reader.readtext(img_np, detail=0)
        return "\n".join(results)

ocr_service = OCRService()
