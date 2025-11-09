"""
Script to parse KML file and export Bucharest sector boundaries to MongoDB
Creates a JSON file that can be imported into MongoDB
"""
import xml.etree.ElementTree as ET
import re
import json
from typing import Dict, List, Tuple

def parse_kml_sectors(kml_file_path: str) -> Dict[str, List[Tuple[float, float]]]:
    """
    Parse KML file and extract sector polygons
    Returns: {sector_name: [(lat, lng), ...]}
    """
    tree = ET.parse(kml_file_path)
    root = tree.getroot()
    
    # Define namespace
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    sectors = {}
    
    # Find all Placemark elements
    for placemark in root.findall('.//kml:Placemark', ns):
        name_elem = placemark.find('kml:name', ns)
        if name_elem is None:
            continue
        
        name = name_elem.text
        # Check if it's a District (Sector)
        if name and name.startswith('District '):
            # Extract sector number
            match = re.search(r'District (\d+)', name)
            if match:
                sector_num = match.group(1)
                sector_name = f"Sector {sector_num}"
                
                # Find coordinates
                coords_elem = placemark.find('.//kml:coordinates', ns)
                if coords_elem is not None and coords_elem.text:
                    # Parse coordinates (format: lng,lat,0)
                    coords_text = coords_elem.text.strip()
                    coords_list = []
                    
                    for coord_line in coords_text.split():
                        parts = coord_line.split(',')
                        if len(parts) >= 2:
                            lng = float(parts[0])
                            lat = float(parts[1])
                            coords_list.append([lat, lng])  # Store as [lat, lng] for MongoDB
                    
                    if coords_list:
                        sectors[sector_name] = coords_list
                        print(f"Found {sector_name} with {len(coords_list)} coordinates")
    
    return sectors

def create_mongodb_documents(sectors: Dict[str, List[List[float]]]) -> List[Dict]:
    """
    Create MongoDB documents for sector boundaries
    Returns: List of MongoDB documents
    """
    documents = []
    
    for sector_name, coordinates in sorted(sectors.items()):
        # Calculate center point for the sector
        if coordinates:
            lats = [coord[0] for coord in coordinates]
            lngs = [coord[1] for coord in coordinates]
            center_lat = sum(lats) / len(lats)
            center_lng = sum(lngs) / len(lngs)
        else:
            center_lat = 44.4268
            center_lng = 26.1025
        
        doc = {
            "sector": sector_name,
            "type": "sector",
            "polygon": {
                "type": "Polygon",
                "coordinates": [coordinates]  # MongoDB GeoJSON format requires array of coordinate arrays
            },
            "center": {
                "type": "Point",
                "coordinates": [center_lng, center_lat]  # GeoJSON uses [lng, lat]
            },
            "metadata": {
                "source": "Bucharest-Ilfov Region.kml",
                "coordinate_count": len(coordinates)
            }
        }
        documents.append(doc)
    
    return documents

def save_mongodb_import_file(documents: List[Dict], output_file: str):
    """Save MongoDB documents to JSON file for import"""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(documents, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved {len(documents)} sector documents to {output_file}")
    print(f"\nTo import into MongoDB:")
    print(f"1. Open MongoDB Compass")
    print(f"2. Connect to your database")
    print(f"3. Select the 'sectors' collection (or create it)")
    print(f"4. Click 'Add Data' → 'Import File'")
    print(f"5. Select '{output_file}'")
    print(f"6. Choose 'JSON' format")
    print(f"7. Click 'Import'")

if __name__ == '__main__':
    import os
    
    # Get the script directory and navigate to project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    kml_file = r'd:\Downloads\Bucharest-Ilfov Region.kml'
    # Output file should be in backend directory (same level as scripts)
    output_file = os.path.join(script_dir, '..', 'sectors_mongodb_import.json')
    output_file = os.path.normpath(output_file)  # Normalize the path
    
    print(f"Parsing KML file: {kml_file}")
    sectors = parse_kml_sectors(kml_file)
    
    print(f"\nFound {len(sectors)} sectors:")
    for sector_name in sorted(sectors.keys()):
        print(f"  - {sector_name}: {len(sectors[sector_name])} coordinates")
    
    print(f"\nCreating MongoDB documents...")
    documents = create_mongodb_documents(sectors)
    
    print(f"\nSaving to {output_file}")
    save_mongodb_import_file(documents, output_file)
    print("\nDone!")

