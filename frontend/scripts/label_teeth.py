import xml.etree.ElementTree as ET
import re
import sys

def parse_svg_path(d):
    """Simple parser to extract all points from a path data string."""
    # Find all x,y pairs. SVG commands format is command followed by coords.
    # We just need approximate bounding box/centroid, so extracting all numbers is usually enough 
    # if we assume absolute positioning or relative. 
    # However, this SVG seems to use 'm' and 'c' (lower case = relative) and 'M' (absolute).
    # A full path parser is complex. 
    # Let's check the file content again. It uses 'm' (relative) and 'M' (absolute, but only at starts?).
    # Actually, looking at the file: "m 1879... c -4,-7 ...". 
    # The first command is 'm' which is relative, but if it's the first one, it's treated as absolute.
    # The subsequent commands are 'c' etc.
    # Using all numbers to just get an average might be risky if relative coords are small vs large absolute ones.
    # BUT, the clusters are likely distinct enough.
    # BETTER APPROACH: Use regex to capture the connection of points. 
    # Given the complexity of writing a partial parser, and the fact that these are teeth icons 
    # which are likely distinct blobs, we can try to rely on the FIRST point of the 'm' command 
    # as the anchor for the tooth position.
    
    # Extract the first coordinate pair after 'm' or 'M'.
    match = re.search(r'[mM]\s*(-?[\d.]+)[,\s](-?[\d.]+)', d)
    if match:
        return float(match.group(1)), float(match.group(2))
    return 0, 0

def transform_point(x, y, matrix):
    """Apply SVG matrix transform."""
    # matrix(a, b, c, d, e, f) -> x' = ax + cy + e, y' = bx + dy + f
    a, b, c, d, e, f = matrix
    return a*x + c*y + e, b*x + d*y + f

def main():
    svg_path = r"d:\Kiran\Elphie_WebApp\frontend\public\dental_chart-01.svg"
    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
    except Exception as e:
        print(f"Error parsing SVG: {e}")
        return

    ns = {'svg': 'http://www.w3.org/2000/svg'}
    ET.register_namespace('', ns['svg'])

    # Find the group with the transform
    # Based on file view: <g transform="matrix(0.1,0,0,-0.1,13.464695,237.4629)" ...>
    # We will look for groups and their paths.
    
    teeth_data = []
    
    # We assume the main group holds the teeth.
    # Determine namespace prefix handling
    # The file has xmlns="http://www.w3.org/2000/svg". ET usually adds ns0.
    
    # Find all paths
    paths = []
    # If using formatted output from view_file, the namespace might be stripped or handled.
    # In the file content provided: <svg ... xmlns="http://www.w3.org/2000/svg" ...>
    # Search recursively for paths
    for path in root.findall(".//{http://www.w3.org/2000/svg}path"):
        paths.append(path)
    
    if not paths:
        # Try without namespace if that failed
        paths = root.findall(".//path")

    print(f"Found {len(paths)} paths.")
    
    if len(paths) != 32:
        print("Warning: Expected 32 paths, found", len(paths))
        # Proceeding anyway as we will process what we find.

    # Matrix for transform
    # Hardcoded or parsed from the specific group in known file structure
    # The file has one main group: <g transform="matrix(0.1,0,0,-0.1,13.464695,237.4629)" ...>
    # Let's find this group to be precise.
    
    main_group = None
    matrix_vals = [1, 0, 0, 1, 0, 0] # Identity default
    
    # Look for the group with the transform
    for g in root.findall(".//{http://www.w3.org/2000/svg}g"):
        transform = g.get('transform')
        if transform and 'matrix' in transform:
             # extract values
             vals = re.findall(r'-?[\d.]+', transform)
             if len(vals) == 6:
                 matrix_vals = [float(v) for v in vals]
                 main_group = g
                 break
    
    if main_group is None:
        print("Could not find main group with transform matrix.")
        # Fallback to identify if paths are inside root or another group
        # But we need the transform to sort Y correctly (since it flips Y).
        # We will use the hardcoded one from the file view if auto-detect fails, 
        # but the above search should work.
        pass

    # Extract positions
    items = []
    for i, path in enumerate(paths):
        d = path.get('d')
        if not d:
            continue
            
        raw_x, raw_y = parse_svg_path(d)
        
        # Apply transform to get screen coordinates
        screen_x, screen_y = transform_point(raw_x, raw_y, matrix_vals)
        
        items.append({
            'path': path,
            'screen_x': screen_x,
            'screen_y': screen_y,
            'raw_y': raw_y,
            'original_id': path.get('id')
        })

    # Sort by Y to separate rows
    # Visual check: Top Row (Teeth 1-16) generally appears higher up.
    # In Screen Coords, Higher Up = Smaller Y value.
    # Let's sort by Screen Y.
    items.sort(key=lambda item: item['screen_y'])
    
    # Split into two rows of 16
    # Provided we have 32 items.
    if len(items) == 32:
        top_row = items[:16]
        bottom_row = items[16:]
    else:
        # Fallback split method using K-Means or mean split if count is off
        avg_y = sum(item['screen_y'] for item in items) / len(items)
        top_row = [item for item in items if item['screen_y'] < avg_y]
        bottom_row = [item for item in items if item['screen_y'] >= avg_y]
    
    # Sort Top Row: Left to Right (X Asc) -> IDs 1 to 16
    top_row.sort(key=lambda item: item['screen_x'])
    for idx, item in enumerate(top_row):
        tooth_num = idx + 1
        new_id = f"tooth-{tooth_num}"
        item['new_id'] = new_id
        item['path'].set('id', new_id)
        print(f"Assigned {new_id} to (Screen X: {item['screen_x']:.1f}, Screen Y: {item['screen_y']:.1f})")

    # Sort Bottom Row: Left to Right (X Asc) -> IDs 32 down to 17
    # Leftmost (Small X) is 32. Rightmost (Large X) is 17.
    bottom_row.sort(key=lambda item: item['screen_x'])
    
    # Assign 32, 31, ... 17
    for idx, item in enumerate(bottom_row):
        tooth_num = 32 - idx
        new_id = f"tooth-{tooth_num}"
        item['new_id'] = new_id
        item['path'].set('id', new_id)
        print(f"Assigned {new_id} to (Screen X: {item['screen_x']:.1f}, Screen Y: {item['screen_y']:.1f})")

    # Save
    tree.write(svg_path, encoding='UTF-8', xml_declaration=True)
    print("Saved modified SVG.")

if __name__ == "__main__":
    main()
