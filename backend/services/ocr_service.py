import os
import base64
from datetime import datetime
from config import Config


class OCRService:
    """Service for extracting data from receipts using OCR"""
    
    def __init__(self):
        self.enabled = False
        # Try to initialize pytesseract if available
        try:
            import pytesseract
            from PIL import Image
            self.pytesseract = pytesseract
            self.Image = Image
            self.enabled = True
        except ImportError:
            print("OCR libraries not available. Using mock OCR service.")
    
    def extract_data_from_receipt(self, file_path):
        """
        Extract expense data from receipt image/PDF
        
        Args:
            file_path: Path to the receipt file
            
        Returns:
            dict: Extracted data (amount, date, description, merchant)
        """
        if not self.enabled:
            return self._mock_ocr(file_path)
        
        try:
            # Check file extension
            file_ext = os.path.splitext(file_path)[1].lower()
            
            if file_ext == '.pdf':
                # Handle PDF files
                return self._extract_from_pdf(file_path)
            else:
                # Handle image files
                return self._extract_from_image(file_path)
                
        except Exception as e:
            print(f"OCR extraction error: {e}")
            return self._mock_ocr(file_path)
    
    def _extract_from_image(self, file_path):
        """Extract text from image using pytesseract"""
        try:
            # Open image
            img = self.Image.open(file_path)
            
            # Extract text using OCR
            text = self.pytesseract.image_to_string(img)
            
            # Parse extracted text
            return self._parse_extracted_text(text, file_path)
            
        except Exception as e:
            print(f"Image OCR error: {e}")
            return self._mock_ocr(file_path)
    
    def _extract_from_pdf(self, file_path):
        """Extract text from PDF"""
        try:
            from PyPDF2 import PdfReader
            
            reader = PdfReader(file_path)
            text = ""
            
            # Extract text from first page
            if len(reader.pages) > 0:
                text = reader.pages[0].extract_text()
            
            # Parse extracted text
            return self._parse_extracted_text(text, file_path)
            
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return self._mock_ocr(file_path)
    
    def _parse_extracted_text(self, text, file_path):
        """Parse extracted text to find amount, date, and description"""
        import re
        
        result = {
            'raw_text': text,
            'amount': None,
            'date': None,
            'description': None,
            'merchant': None
        }
        
        # Try to extract amount (look for currency patterns)
        amount_patterns = [
            r'\$[\d,]+\.?\d*',  # USD format
            r'€[\d,]+\.?\d*',   # EUR format
            r'£[\d,]+\.?\d*',   # GBP format
            r'₹[\d,]+\.?\d*',   # INR format
            r'\d+\.?\d*\s*(USD|EUR|GBP|INR)',  # Currency code after amount
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Extract numeric value
                amount_str = match.group(0)
                # Remove currency symbols and commas
                amount_clean = re.sub(r'[^\d.]', '', amount_str)
                try:
                    result['amount'] = float(amount_clean)
                except ValueError:
                    pass
                break
        
        # Try to extract date
        date_patterns = [
            r'\d{1,2}/\d{1,2}/\d{2,4}',  # MM/DD/YYYY or DD/MM/YYYY
            r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
            r'\d{2}-\d{2}-\d{4}',  # DD-MM-YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                result['date'] = match.group(0)
                break
        
        # Use first line as merchant/description
        lines = text.strip().split('\n')
        if lines:
            result['merchant'] = lines[0].strip()[:100]
            result['description'] = text[:200]
        
        return result
    
    def _mock_ocr(self, file_path):
        """Return mock OCR data when OCR is not available or fails"""
        return {
            'raw_text': 'Mock receipt text',
            'amount': None,  # Will be filled by user
            'date': datetime.now().strftime('%Y-%m-%d'),
            'description': 'Receipt uploaded - OCR extraction attempted',
            'merchant': 'Unknown Merchant',
            'note': 'OCR libraries not available. Please enter details manually.'
        }
