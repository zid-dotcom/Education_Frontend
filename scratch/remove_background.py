import collections
from PIL import Image

def remove_white_background(input_path, output_path, threshold=232, diff_tol=20):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Flood fill starting from the 4 image borders
    visited = set()
    queue = collections.deque()

    def is_white(x, y):
        r, g, b, a = pixels[x, y]
        min_c = min(r, g, b)
        max_c = max(r, g, b)
        return min_c >= threshold and (max_c - min_c) <= diff_tol

    # Add all border pixels that are background white
    for x in range(width):
        for y in [0, height - 1]:
            if is_white(x, y) and (x, y) not in visited:
                visited.add((x, y))
                queue.append((x, y))

    for y in range(height):
        for x in [0, width - 1]:
            if is_white(x, y) and (x, y) not in visited:
                visited.add((x, y))
                queue.append((x, y))

    # BFS flood-fill
    while queue:
        cx, cy = queue.popleft()
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited and is_white(nx, ny):
                    visited.add((nx, ny))
                    queue.append((nx, ny))

    # Apply transparency to visited background pixels
    for x, y in visited:
        r, g, b, a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)

    # Soft feather for 1-pixel border around background
    for x in range(width):
        for y in range(height):
            if (x, y) not in visited:
                r, g, b, a = pixels[x, y]
                min_c = min(r, g, b)
                if min_c >= 220:
                    # Check if neighboring a transparent background pixel
                    has_bg = False
                    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nx, ny = x + dx, y + dy
                        if (nx, ny) in visited:
                            has_bg = True
                            break
                    if has_bg:
                        alpha = int(round((255 - min_c) / 35.0 * 255))
                        pixels[x, y] = (r, g, b, max(0, min(255, alpha)))

    img.save(output_path, "PNG")
    print(f"Processed and saved transparent image: {output_path}")

remove_white_background(
    "d:/Aurumfx-works/aurum_education/src/assets/boyimage.jpeg",
    "d:/Aurumfx-works/aurum_education/src/assets/boyimage.png",
    threshold=230,
    diff_tol=22
)

remove_white_background(
    "d:/Aurumfx-works/aurum_education/src/assets/girlimage.jpeg",
    "d:/Aurumfx-works/aurum_education/src/assets/girlimage.png",
    threshold=230,
    diff_tol=22
)

