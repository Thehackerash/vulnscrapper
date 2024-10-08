import pandas as pd
import subprocess
from concurrent.futures import ThreadPoolExecutor
import multiprocessing  # Import to detect number of CPU cores

# Load URLs from a JSON file
def load_urls_from_json(file_path):
    print(f"Loading URLs from {file_path}")
    try:
        df = pd.read_json('urls.json')
        urls = df['url'].tolist()
        return urls
    except Exception as e:
        print(f"An error occurred while loading URLs: {e}")
        return []

urls = load_urls_from_json("urls.json")
# print(urls)

# Function to run the JS scraping script for a given URL
def run_scraper(url):
    print(url)
    try:
        print(f"Starting scraper for {url}")
        # Run the Node.js scraper as a subprocess and pass the URL as an argument
        subprocess.run(["node", "./changeMonitor.js", url], check=True)
        print(f"Scraping completed for {url}")
    except Exception as e:
        print(f"An error occurred for {url}: {e}")

# Multithreading with ThreadPoolExecutor
def run_scrapers_multithreaded():
    num_cores = multiprocessing.cpu_count()  # Detect number of CPU cores
    with ThreadPoolExecutor(max_workers=num_cores) as executor:  # Adjust the number of threads
        executor.map(run_scraper, urls)

if __name__ == "__main__":
    run_scrapers_multithreaded()
