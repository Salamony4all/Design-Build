"""
BOQ PDF Extraction Script
Extracts furniture and fit-out BOQ data from PDF files
"""

import pdfplumber
import json
import re
import os

def extract_boq_from_pdf(pdf_path, category):
    """Extract BOQ data from a PDF file"""
    items = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            tables_data = []
            
            for page_num, page in enumerate(pdf.pages):
                # Extract text
                text = page.extract_text()
                if text:
                    full_text += f"\n--- Page {page_num + 1} ---\n{text}"
                
                # Extract tables
                tables = page.extract_tables()
                for table in tables:
                    if table:
                        tables_data.append({
                            'page': page_num + 1,
                            'data': table
                        })
            
            # Save raw extraction for debugging
            debug_file = pdf_path.replace('.pdf', '_extracted.txt')
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(full_text)
                f.write("\n\n=== TABLES ===\n")
                for t in tables_data:
                    f.write(f"\nPage {t['page']}:\n")
                    for row in t['data']:
                        f.write(str(row) + '\n')
            
            print(f"✓ Extracted {len(pdf.pages)} pages from {os.path.basename(pdf_path)}")
            print(f"  Found {len(tables_data)} tables")
            print(f"  Debug saved to: {debug_file}")
            
            # Parse tables into structured items
            for table_info in tables_data:
                table = table_info['data']
                if len(table) > 1:  # Must have header + data
                    header = table[0] if table[0] else []
                    
                    for row in table[1:]:
                        if row and len(row) >= 3:
                            item = parse_boq_row(row, header, category)
                            if item:
                                items.append(item)
            
            return items, full_text
            
    except Exception as e:
        print(f"Error extracting {pdf_path}: {e}")
        return [], ""

def parse_boq_row(row, header, category):
    """Parse a single BOQ row into structured data"""
    try:
        # Clean row data
        cleaned = [str(cell).strip() if cell else '' for cell in row]
        
        # Try to identify item code, description, unit, rate
        item = {
            'category': category,
            'raw_data': cleaned
        }
        
        # Look for item codes (patterns like LF01, MA-201, EQ-05, etc.)
        code_pattern = r'^[A-Z]{1,3}[-]?\d{1,4}[A-Z]?$'
        
        for i, cell in enumerate(cleaned):
            if re.match(code_pattern, cell):
                item['code'] = cell
            elif any(keyword in cell.lower() for keyword in ['omr', 'rate', 'price', 'amount']):
                # Try to extract numeric rate
                numbers = re.findall(r'[\d,]+\.?\d*', cell)
                if numbers:
                    try:
                        item['rate'] = float(numbers[0].replace(',', ''))
                    except:
                        pass
            elif len(cell) > 20:  # Likely a description
                item['description'] = cell
        
        # Try to extract rate from last columns (common BOQ format)
        for cell in reversed(cleaned):
            if cell:
                try:
                    rate = float(cell.replace(',', '').replace('OMR', '').strip())
                    if rate > 0:
                        item['rate'] = rate
                        break
                except:
                    continue
        
        if 'code' in item or 'description' in item:
            return item
        return None
        
    except Exception as e:
        return None

def main():
    """Main extraction function"""
    boq_library = {
        'metadata': {
            'extracted_date': '2026-01-15',
            'currency': 'OMR',
            'vat_rate': 0.05,
            'source': 'Carbon Engineering BOQ Standards'
        },
        'furniture': [],
        'fitout': [],
        'materials': {}
    }
    
    # Extract Furniture BOQ
    furniture_path = 'BOQ_Furniture.pdf'
    if os.path.exists(furniture_path):
        items, text = extract_boq_from_pdf(furniture_path, 'furniture')
        boq_library['furniture'] = items
        print(f"  Parsed {len(items)} furniture items")
    
    # Extract Fit-Out BOQ
    fitout_path = 'BOQ_FitOut.pdf'
    if os.path.exists(fitout_path):
        items, text = extract_boq_from_pdf(fitout_path, 'fitout')
        boq_library['fitout'] = items
        print(f"  Parsed {len(items)} fit-out items")
    
    # Save extracted library
    with open('boq_library_raw.json', 'w', encoding='utf-8') as f:
        json.dump(boq_library, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ BOQ Library saved to boq_library_raw.json")
    
    return boq_library

if __name__ == '__main__':
    main()
