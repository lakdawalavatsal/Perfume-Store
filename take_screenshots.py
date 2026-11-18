import subprocess
import time
import os

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def capture(url, out_name, width, height, scroll_y=0):
    # Using chrome with virtual time or scroll
    script = f"""
    window.scrollTo(0, {scroll_y});
    """
    cmd = [
        CHROME,
        "--headless",
        "--disable-gpu",
        f"--window-size={width},{height}",
        f"--screenshot={out_name}",
        "--hide-scrollbars",
        url
    ]
    subprocess.run(cmd, check=True)
    print(f"Captured {out_name}")

# Capture desktop sections
capture("http://localhost:5180/#signature-showcase", "preview_desktop_orbit.png", 1440, 1100)
capture("http://localhost:5180/#shop", "preview_desktop_shop.png", 1440, 1400)
capture("http://localhost:5180/#story", "preview_desktop_story.png", 1440, 1200)

# Capture mobile
capture("http://localhost:5180/#signature-showcase", "preview_mobile_orbit.png", 390, 844)
capture("http://localhost:5180/#shop", "preview_mobile_shop.png", 390, 900)
